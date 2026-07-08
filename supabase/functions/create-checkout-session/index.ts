/**
 * Edge Function : create-checkout-session
 * Crée une session Stripe Checkout en mode "subscription" pour l'abonnement
 * SaaS ZenFacture (Essentiel gratuit / Professionnel / Entreprise).
 *
 * À ne pas confondre avec create-payment-link (paiement ponctuel d'une facture
 * client via Payrexx/Stripe) : cette fonction gère l'abonnement récurrent au
 * produit ZenFacture lui-même.
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://zenfacture.ch';

serve(async (req) => {
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
      .select('stripe_customer_id, email')
      .eq('id', organisationId)
      .maybeSingle();

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
