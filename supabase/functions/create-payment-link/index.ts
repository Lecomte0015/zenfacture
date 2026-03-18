/**
 * Edge Function : create-payment-link
 * Crée un lien de paiement via Payrexx (recommandé CH) ou Stripe (fallback).
 *
 * Variables d'environnement requises (au moins UN prestataire) :
 *
 * Payrexx (prioritaire — supporte TWINT, PostFinance, cartes suisses) :
 *   PAYREXX_INSTANCE  — Nom de votre instance (ex: "maboutique")
 *   PAYREXX_API_KEY   — Clé API dans votre espace Payrexx → Intégrations → API
 *
 * Stripe (fallback — international, pas TWINT) :
 *   STRIPE_SECRET_KEY — Clé secrète (sk_live_... ou sk_test_...)
 *
 * La table Supabase `payment_links` stocke les liens créés.
 * Le webhook Payrexx/Stripe met à jour le statut via une autre fonction.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Secrets
const PAYREXX_INSTANCE = Deno.env.get('PAYREXX_INSTANCE') ?? '';
const PAYREXX_API_KEY = Deno.env.get('PAYREXX_API_KEY') ?? '';
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://zenfacture.ch';

// ─── Payrexx ──────────────────────────────────────────────────────────────────

async function createPayrexxLink(params: {
  invoiceId: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  clientEmail?: string;
  description?: string;
}): Promise<{ paymentUrl: string; externalId: string }> {
  const { invoiceId, invoiceNumber, amountCents, currency, clientEmail, description } = params;

  // Payrexx utilise une API de signature HMAC
  // Docs : https://developers.payrexx.com/reference/gateway
  const body = new URLSearchParams({
    amount: String(amountCents),
    currency: currency.toUpperCase(),
    purpose: description || `Facture ${invoiceNumber}`,
    referenceId: invoiceNumber,
    successRedirectUrl: `${APP_URL}/factures?payment=success&id=${invoiceId}`,
    failedRedirectUrl: `${APP_URL}/factures?payment=failed&id=${invoiceId}`,
    cancelRedirectUrl: `${APP_URL}/factures?payment=cancelled&id=${invoiceId}`,
    ...(clientEmail ? { email: clientEmail } : {}),
    // Activer TWINT, PostFinance et les principales cartes
    pm: 'twint;postfinance_card;visa;mastercard;american_express;apple_pay;google_pay',
    apiSignature: PAYREXX_API_KEY,
  });

  const response = await fetch(
    `https://api.payrexx.com/v1.0/Gateway/?instance=${PAYREXX_INSTANCE}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Payrexx error ${response.status}: ${err}`);
  }

  const result = await response.json();

  if (result.status !== 'success' || !result.data?.[0]) {
    throw new Error(result.message || 'Réponse Payrexx invalide');
  }

  const gateway = result.data[0];
  return {
    paymentUrl: gateway.link,
    externalId: String(gateway.id),
  };
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

async function createStripeLink(params: {
  invoiceId: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  clientEmail?: string;
  description?: string;
}): Promise<{ paymentUrl: string; externalId: string }> {
  const { invoiceId, invoiceNumber, amountCents, currency, clientEmail, description } = params;

  const body = new URLSearchParams({
    'line_items[0][price_data][currency]': currency.toLowerCase(),
    'line_items[0][price_data][product_data][name]': description || `Facture ${invoiceNumber}`,
    'line_items[0][price_data][unit_amount]': String(amountCents),
    'line_items[0][quantity]': '1',
    mode: 'payment',
    success_url: `${APP_URL}/factures?payment=success&id=${invoiceId}`,
    cancel_url: `${APP_URL}/factures?payment=cancelled&id=${invoiceId}`,
    metadata: JSON.stringify({ invoiceId, invoiceNumber }),
    ...(clientEmail ? { customer_email: clientEmail } : {}),
  });

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Stripe error: ${err.error?.message || response.statusText}`);
  }

  const session = await response.json();
  return { paymentUrl: session.url, externalId: session.id };
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Vérifier authentification
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { invoiceId, invoiceNumber, amountCents, currency = 'CHF', clientEmail, description } = body;

    if (!invoiceId || !invoiceNumber || !amountCents) {
      return new Response(JSON.stringify({ error: 'Champs requis : invoiceId, invoiceNumber, amountCents' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Vérifier si un lien non expiré existe déjà
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: existing } = await supabase
      .from('payment_links')
      .select('payment_url')
      .eq('invoice_id', invoiceId)
      .in('status', ['pending', 'active'])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.payment_url) {
      return new Response(JSON.stringify({ paymentUrl: existing.payment_url, cached: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Choisir le prestataire
    let result: { paymentUrl: string; externalId: string };
    let provider: string;

    if (PAYREXX_INSTANCE && PAYREXX_API_KEY) {
      result = await createPayrexxLink({ invoiceId, invoiceNumber, amountCents, currency, clientEmail, description });
      provider = 'payrexx';
    } else if (STRIPE_SECRET_KEY) {
      result = await createStripeLink({ invoiceId, invoiceNumber, amountCents, currency, clientEmail, description });
      provider = 'stripe';
    } else {
      return new Response(JSON.stringify({
        error: 'Aucun prestataire de paiement configuré. Ajoutez PAYREXX_INSTANCE + PAYREXX_API_KEY ou STRIPE_SECRET_KEY dans les secrets Supabase.',
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Sauvegarder le lien en base
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expire dans 30 jours

    await supabase.from('payment_links').insert({
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      payment_url: result.paymentUrl,
      external_id: result.externalId,
      provider,
      amount_cents: amountCents,
      currency: currency.toUpperCase(),
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ paymentUrl: result.paymentUrl, externalId: result.externalId, provider }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Erreur create-payment-link:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
