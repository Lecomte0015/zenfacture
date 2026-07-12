/**
 * Edge Function : create-checkout-session
 * Gère les changements d'abonnement SaaS ZenFacture (Essentiel / Professionnel
 * / Entreprise, mensuel ou annuel — voir stripeService.ts → getPriceIdForPlan).
 *
 * À ne pas confondre avec create-payment-link (paiement ponctuel d'une facture
 * client via Payrexx/Stripe) : cette fonction gère l'abonnement récurrent au
 * produit ZenFacture lui-même.
 *
 * IMPORTANT — deux chemins possibles :
 *   1. Le profil n'a PAS encore d'abonnement Stripe actif → on crée une
 *      session Stripe Checkout classique (redirection vers Stripe).
 *   2. Le profil a DÉJÀ un abonnement actif (changement de plan, upgrade ou
 *      downgrade) → on modifie l'abonnement existant en place (proration
 *      automatique par Stripe), sans jamais créer une deuxième session
 *      Checkout. Créer une nouvelle session Checkout alors qu'un abonnement
 *      est déjà actif créerait un DEUXIÈME abonnement Stripe et facturerait
 *      le client deux fois — c'est le bug que ce chemin évite.
 *      Dans ce cas, le webhook `customer.subscription.updated` (déjà géré
 *      par stripe-webhook) se charge de mettre à jour `profils` ensuite ;
 *      cette fonction ne touche jamais `profils` elle-même.
 *
 * Variables d'environnement requises (secrets Supabase) :
 *   STRIPE_SECRET_KEY — Clé secrète Stripe (sk_live_... ou sk_test_...)
 *   APP_URL           — URL de production de l'app (ex: https://zenfacture.ch)
 *
 * Le prix (priceId) est fourni par le client (voir stripeService.ts →
 * getPriceIdForPlan) ; les price ID Stripe ne sont pas des secrets.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const BASE_ALLOWED_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-application-name';

function buildCorsHeaders(req: Request): Record<string, string> {
  const requestedHeaders = req.headers.get('Access-Control-Request-Headers');
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': requestedHeaders || BASE_ALLOWED_HEADERS,
  };
}

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://zenfacture.ch';

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({
      error: 'Stripe non configuré. Ajoutez STRIPE_SECRET_KEY dans les secrets Supabase (supabase secrets set STRIPE_SECRET_KEY=sk_...).',
    }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json();
    const { priceId, organisationId, customerEmail } = body;

    if (!priceId || !organisationId) {
      return new Response(JSON.stringify({ error: 'Champs requis : priceId, organisationId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Réutiliser le customer Stripe existant si le profil en a déjà un
    const { data: profil } = await supabase
      .from('profils')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status, email')
      .eq('id', organisationId)
      .maybeSingle();

    // ── Changement de plan sur un abonnement déjà actif : on modifie en
    //    place au lieu de créer une deuxième session Checkout (voir note en
    //    tête de fichier) ──────────────────────────────────────────────────
    const hasActiveSubscription = !!profil?.stripe_subscription_id &&
      (profil.subscription_status === 'active' || profil.subscription_status === 'trialing');

    if (hasActiveSubscription) {
      const subscription = await fetch(
        `https://api.stripe.com/v1/subscriptions/${profil!.stripe_subscription_id}`,
        { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
      ).then((r) => r.json());

      const currentItemId = subscription?.items?.data?.[0]?.id;
      if (!currentItemId) {
        throw new Error("Impossible de retrouver l'élément d'abonnement Stripe à modifier");
      }

      const updateParams = new URLSearchParams({
        'items[0][id]': currentItemId,
        'items[0][price]': priceId,
        proration_behavior: 'create_prorations',
      });

      const updateResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${profil!.stripe_subscription_id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: updateParams.toString(),
        }
      );

      if (!updateResponse.ok) {
        const err = await updateResponse.json();
        throw new Error(`Stripe error: ${err.error?.message || updateResponse.statusText}`);
      }

      // Pas de redirection : le changement est immédiat. `profils` sera mis à
      // jour par le webhook customer.subscription.updated (déclenché par
      // Stripe suite à cet appel), pas directement ici.
      return new Response(JSON.stringify({ updated: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: `${APP_URL}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/dashboard/billing/cancel`,
      client_reference_id: organisationId,
      'metadata[organisationId]': organisationId,
      'subscription_data[metadata][organisationId]': organisationId,
      allow_promotion_codes: 'true',
    });

    if (profil?.stripe_customer_id) {
      params.set('customer', profil.stripe_customer_id);
    } else if (customerEmail || profil?.email) {
      params.set('customer_email', customerEmail || profil.email);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Stripe error: ${err.error?.message || response.statusText}`);
    }

    const session = await response.json();

    return new Response(JSON.stringify({ checkoutUrl: session.url, sessionId: session.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Erreur create-checkout-session:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
