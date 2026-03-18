/**
 * Service de paiement en ligne — ZenFacture
 *
 * Priorité 1 — Payrexx (recommandé Suisse)
 *   Support : TWINT, PostFinance, Mastercard, Visa, American Express, Apple Pay, Google Pay
 *   Inscription : https://payrexx.com → compte marchand gratuit
 *   Variables d'env Supabase :
 *     PAYREXX_INSTANCE  — Nom de l'instance (ex: zenfacture)
 *     PAYREXX_API_KEY   — Clé API Payrexx
 *
 * Priorité 2 — Stripe (fallback international)
 *   Variables d'env Supabase :
 *     STRIPE_SECRET_KEY — Clé secrète Stripe
 *
 * Utilisation :
 *   const link = await createPaymentLink({ invoiceId, invoiceNumber, amount, currency, clientEmail, description });
 *   → Retourne l'URL de paiement à partager avec le client
 */

import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatePaymentLinkParams {
  invoiceId: string;
  invoiceNumber: string;
  /** Montant en centimes (ex: 15000 pour 150.00 CHF) */
  amountCents: number;
  /** Devise : CHF, EUR, USD */
  currency?: string;
  clientEmail?: string;
  description?: string;
}

export interface PaymentLinkResult {
  success: boolean;
  /** URL de paiement à partager avec le client */
  paymentUrl?: string;
  /** ID du lien de paiement chez le prestataire */
  externalId?: string;
  error?: string;
}

export interface InvoicePaymentStatus {
  invoiceId: string;
  paid: boolean;
  paidAt?: string;
  paymentMethod?: string;
  transactionId?: string;
}

// ─── Création du lien de paiement ────────────────────────────────────────────

/**
 * Crée un lien de paiement via l'Edge Function Supabase.
 * Le prestataire (Payrexx ou Stripe) est choisi côté serveur selon les clés configurées.
 */
export async function createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment-link', {
      body: params,
    });

    if (error) {
      return { success: false, error: error.message || 'Erreur lors de la création du lien' };
    }
    if (data?.error) {
      return { success: false, error: data.error };
    }
    return { success: true, paymentUrl: data.paymentUrl, externalId: data.externalId };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur réseau' };
  }
}

/**
 * Vérifie le statut de paiement d'une facture (via la table payment_links en base).
 */
// Type local pour la table payment_links (pas encore dans les types générés Supabase)
interface PaymentLinkRow {
  payment_url: string;
  status: string;
  expires_at: string | null;
  paid_at: string | null;
  payment_method: string | null;
  external_transaction_id: string | null;
}

export async function getInvoicePaymentStatus(invoiceId: string): Promise<InvoicePaymentStatus | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('payment_links')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('status', 'paid')
    .maybeSingle() as { data: PaymentLinkRow | null; error: unknown };

  if (error || !data) return null;

  return {
    invoiceId,
    paid: true,
    paidAt: data.paid_at ?? undefined,
    paymentMethod: data.payment_method ?? undefined,
    transactionId: data.external_transaction_id ?? undefined,
  };
}

/**
 * Récupère le lien de paiement actif pour une facture (s'il existe déjà).
 */
export async function getExistingPaymentLink(invoiceId: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('payment_links')
    .select('payment_url, status, expires_at')
    .eq('invoice_id', invoiceId)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: PaymentLinkRow | null; error: unknown };

  if (error || !data) return null;

  // Vérifier expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return data.payment_url;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convertit un montant décimal en centimes (ex: 150.50 → 15050).
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Formate un montant en centimes en chaîne lisible (ex: 15050 → "150.50").
 */
export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
