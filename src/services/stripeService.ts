/**
 * Service Stripe — Abonnements SaaS ZenFacture (Phase 4.3)
 *
 * Contrairement à payrexxService.ts (paiement ponctuel d'une facture client),
 * ce service gère l'abonnement RÉCURRENT au SaaS ZenFacture lui-même
 * (plans Essentiel / Professionnel / Entreprise — voir PricingPage.tsx / BillingPage.tsx).
 *
 * Variables d'env Supabase requises (à définir avec `supabase secrets set`) :
 *   STRIPE_SECRET_KEY       — Clé secrète Stripe (sk_live_... ou sk_test_...)
 *   STRIPE_WEBHOOK_SECRET   — Secret de signature du webhook (whsec_...)
 *   STRIPE_PRICE_ID_ESSENTIEL_MONTHLY / _ANNUALLY
 *   STRIPE_PRICE_ID_PRO_MONTHLY / _ANNUALLY
 *   STRIPE_PRICE_ID_ENTREPRISE_MONTHLY / _ANNUALLY
 *   APP_URL                 — URL de production (pour les redirections success/cancel)
 *
 * Configuration côté Stripe Dashboard (à faire par l'utilisateur, pas automatisable ici) :
 *   1. Créer un compte Stripe (https://dashboard.stripe.com/register)
 *   2. Créer les produits + prix récurrents pour chaque plan payant
 *   3. Configurer un endpoint de webhook pointant vers :
 *      https://<votre-projet>.supabase.co/functions/v1/stripe-webhook
 *      en écoutant : checkout.session.completed, customer.subscription.updated,
 *      customer.subscription.deleted
 *   4. Copier le secret de signature du webhook dans STRIPE_WEBHOOK_SECRET
 */

import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanAbonnement = 'essentiel' | 'pro' | 'entreprise';
export type CycleFacturation = 'monthly' | 'annually';

export interface CreateCheckoutSessionParams {
  /** ID du prix Stripe (price_...) correspondant au plan choisi */
  priceId: string;
  /**
   * Identifiant de l'organisation/profil à créditer après paiement.
   * ZenFacture pilote le plan par profil utilisateur (profils.id = auth.uid()),
   * donc en pratique il s'agit de l'ID utilisateur ; le nom "organisationId"
   * est conservé pour permettre une migration future vers un modèle multi-orga.
   */
  organisationId: string;
  /** Email du client, pré-rempli dans Stripe Checkout si disponible */
  customerEmail?: string;
}

export interface CheckoutSessionResult {
  success: boolean;
  /** URL Stripe Checkout vers laquelle rediriger l'utilisateur (absent si `updated`) */
  checkoutUrl?: string;
  sessionId?: string;
  /**
   * true si l'abonnement existant a été modifié en place (changement de plan
   * sans passer par Checkout — voir create-checkout-session/index.ts). Dans
   * ce cas il n'y a pas de redirection : le changement est déjà effectif.
   */
  updated?: boolean;
  error?: string;
}

export interface SubscriptionStatus {
  status: string;
  planAbonnement: PlanAbonnement;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
}

// ─── Création de la session Stripe Checkout ──────────────────────────────────

/**
 * Crée une session Stripe Checkout (mode subscription) via l'Edge Function
 * `create-checkout-session`, puis retourne l'URL vers laquelle rediriger
 * l'utilisateur pour finaliser le paiement.
 */
export async function createCheckoutSession(
  priceId: string,
  organisationId: string,
  customerEmail?: string
): Promise<CheckoutSessionResult> {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId, organisationId, customerEmail } as CreateCheckoutSessionParams,
    });

    if (error) {
      return { success: false, error: error.message || 'Erreur lors de la création de la session de paiement' };
    }
    if (data?.error) {
      return { success: false, error: data.error };
    }
    if (data?.updated) {
      return { success: true, updated: true };
    }
    return { success: true, checkoutUrl: data.checkoutUrl, sessionId: data.sessionId };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur réseau' };
  }
}

/**
 * Lance un changement de plan : redirige vers Stripe Checkout pour un tout
 * premier abonnement, ou modifie l'abonnement existant en place (sans
 * redirection) si le profil a déjà un abonnement actif — voir
 * create-checkout-session/index.ts pour la logique côté serveur.
 */
export async function redirectToCheckout(
  priceId: string,
  organisationId: string,
  customerEmail?: string
): Promise<{ error?: string; updated?: boolean }> {
  const result = await createCheckoutSession(priceId, organisationId, customerEmail);
  if (!result.success) {
    return { error: result.error || "Impossible d'initier le paiement" };
  }
  if (result.updated) {
    return { updated: true };
  }
  if (!result.checkoutUrl) {
    return { error: "Impossible d'initier le paiement" };
  }
  window.location.href = result.checkoutUrl;
  return {};
}

// ─── Statut de l'abonnement ───────────────────────────────────────────────────

/**
 * Récupère le statut d'abonnement Stripe courant depuis la table `profils`.
 * Les colonnes stripe_* sont mises à jour par l'Edge Function `stripe-webhook`.
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
  const { data, error } = await supabase
    .from('profils')
    .select('plan_abonnement, subscription_status, stripe_customer_id, stripe_subscription_id, stripe_price_id')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    status: data.subscription_status ?? 'none',
    planAbonnement: (data.plan_abonnement as PlanAbonnement) ?? 'essentiel',
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    stripePriceId: data.stripe_price_id,
  };
}

// ─── Mapping plan ⇄ price ID ──────────────────────────────────────────────────

// Les 3 plans sont désormais tous payants (Essentiel inclus, 19 CHF/mois —
// voir PricingPage.tsx). Il n'y a plus de plan "gratuit" à proprement parler :
// l'accès gratuit vient uniquement de l'essai de 30 jours (voir useTrial.ts),
// pas d'un plan permanent sans carte bancaire.
export const PLANS_PAYANTS: PlanAbonnement[] = ['essentiel', 'pro', 'entreprise'];

export function estPlanPayant(plan: PlanAbonnement): boolean {
  return PLANS_PAYANTS.includes(plan);
}

/**
 * Prix affichés (CHF, en francs entiers) — doit rester synchronisé avec
 * PricingPage.tsx et avec les Prices créés côté Stripe. Le prix annuel est
 * le montant total facturé une fois par an (pas un équivalent mensuel).
 */
export const TARIFS_CHF: Record<PlanAbonnement, { monthly: number; annually: number }> = {
  essentiel: { monthly: 19, annually: 180 },
  pro: { monthly: 49, annually: 468 },
  entreprise: { monthly: 99, annually: 948 },
};

/**
 * Résout l'ID de prix Stripe (price_...) pour un plan + cycle de facturation
 * donnés, à partir des variables d'environnement Vite (exposées côté client —
 * les price ID Stripe ne sont pas sensibles, seule STRIPE_SECRET_KEY doit
 * rester côté serveur).
 *
 * Nécessite les 6 variables VITE_STRIPE_PRICE_ID_<PLAN>_<CYCLE> dans le
 * fichier .env (voir .env.example).
 */
export function getPriceIdForPlan(plan: PlanAbonnement, cycle: CycleFacturation = 'monthly'): string | null {
  const key = `VITE_STRIPE_PRICE_ID_${plan.toUpperCase()}_${cycle.toUpperCase()}`;
  return (import.meta.env as Record<string, string | undefined>)[key] || null;
}
