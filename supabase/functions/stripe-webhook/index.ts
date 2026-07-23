/**
 * Edge Function : stripe-webhook
 * Écoute les événements Stripe liés à l'abonnement SaaS ZenFacture et met à
 * jour le plan de l'utilisateur dans la table `profils`.
 *
 * Événements gérés :
 *   - checkout.session.completed    → active le plan choisi, enregistre stripe_customer_id / stripe_subscription_id
 *   - customer.subscription.updated → met à jour le statut (active, past_due, etc.) et le plan si le prix a changé
 *   - customer.subscription.deleted → repasse le profil au plan "essentiel" (gratuit)
 *
 * Configuration requise (secrets Supabase) :
 *   STRIPE_SECRET_KEY      — Clé secrète Stripe
 *   STRIPE_WEBHOOK_SECRET  — Secret de signature (whsec_...), fourni par le
 *                            Dashboard Stripe lors de la création de l'endpoint webhook
 *   STRIPE_PRICE_ID_ESSENTIEL_MONTHLY / _ANNUALLY — price_... du plan Essentiel
 *   STRIPE_PRICE_ID_PRO_MONTHLY / _ANNUALLY        — price_... du plan Professionnel
 *   STRIPE_PRICE_ID_ENTREPRISE_MONTHLY / _ANNUALLY — price_... du plan Entreprise
 *
 * Configuration Dashboard Stripe (à faire manuellement par l'utilisateur) :
 *   Developers → Webhooks → Add endpoint
 *   URL : https://<votre-projet>.supabase.co/functions/v1/stripe-webhook
 *   Événements à cocher : checkout.session.completed, customer.subscription.updated,
 *   customer.subscription.deleted
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

// Table de correspondance price_id → plan. Un plan a un prix mensuel ET un
// prix annuel (voir PricingPage.tsx) : les deux doivent mapper vers le même
// plan, seul `subscription_status`/facturation change, pas les fonctionnalités.
const PRICE_ID_TO_PLAN: Record<string, 'essentiel' | 'pro' | 'entreprise'> = {
  [Deno.env.get('STRIPE_PRICE_ID_ESSENTIEL_MONTHLY') ?? '']: 'essentiel',
  [Deno.env.get('STRIPE_PRICE_ID_ESSENTIEL_ANNUALLY') ?? '']: 'essentiel',
  [Deno.env.get('STRIPE_PRICE_ID_PRO_MONTHLY') ?? '']: 'pro',
  [Deno.env.get('STRIPE_PRICE_ID_PRO_ANNUALLY') ?? '']: 'pro',
  [Deno.env.get('STRIPE_PRICE_ID_ENTREPRISE_MONTHLY') ?? '']: 'entreprise',
  [Deno.env.get('STRIPE_PRICE_ID_ENTREPRISE_ANNUALLY') ?? '']: 'entreprise',
};
delete PRICE_ID_TO_PLAN[''];

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function planFromPriceId(priceId: string | null | undefined): 'essentiel' | 'pro' | 'entreprise' {
  if (priceId && PRICE_ID_TO_PLAN[priceId]) return PRICE_ID_TO_PLAN[priceId];
  return 'essentiel';
}

/**
 * Vérifie la signature Stripe (HMAC SHA-256) sans dépendance externe,
 * en suivant l'algorithme documenté par Stripe pour les webhooks.
 * https://stripe.com/docs/webhooks/signatures
 */
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(
    sigHeader.split(',').map((part) => {
      const [k, v] = part.split('=');
      return [k, v];
    })
  );
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expectedSignature = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSignature === signature;
}

async function stripeGet(path: string) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!response.ok) {
    throw new Error(`Stripe GET ${path} failed: ${response.status}`);
  }
  return response.json();
}

async function stripePost(path: string, params: Record<string, string>) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Stripe POST ${path} failed: ${response.status} ${err}`);
  }
  return response.json();
}

/**
 * Programme de parrainage (migration 20260723000000_referral_program.sql) :
 * si le profil qui vient de devenir payant (checkout.session.completed) a été
 * parrainé et n'a pas encore déclenché de récompense, crédite le parrain d'un
 * mois de son abonnement via le solde client Stripe (customer balance —
 * appliqué automatiquement sur sa prochaine facture). Ne fait jamais échouer
 * le webhook : une erreur ici est loguée mais n'empêche pas le reste de
 * fonctionner.
 */
async function applyReferralRewardIfNeeded(referredProfileId: string): Promise<void> {
  const { data: referred } = await supabase
    .from('profils')
    .select('referred_by_profile_id, referral_reward_granted_at')
    .eq('id', referredProfileId)
    .maybeSingle();

  if (!referred?.referred_by_profile_id || referred.referral_reward_granted_at) return;

  const { data: referrer } = await supabase
    .from('profils')
    .select('stripe_customer_id, stripe_price_id')
    .eq('id', referred.referred_by_profile_id)
    .maybeSingle();

  // Sans stripe_customer_id, le parrain n'a jamais payé lui-même : rien à
  // créditer pour l'instant (pas de facture sur laquelle appliquer un solde).
  if (!referrer?.stripe_customer_id) return;

  let amountCents = 1900; // Repli : prix mensuel Essentiel (19 CHF) si le prix du parrain est introuvable
  if (referrer.stripe_price_id) {
    try {
      const price = await stripeGet(`/v1/prices/${referrer.stripe_price_id}`);
      if (typeof price.unit_amount === 'number') {
        // Un prix annuel doit créditer l'équivalent d'UN mois, pas l'année entière
        amountCents = price.recurring?.interval === 'year'
          ? Math.round(price.unit_amount / 12)
          : price.unit_amount;
      }
    } catch (err) {
      console.error('Parrainage: impossible de récupérer le prix du parrain, repli sur 19 CHF', err);
    }
  }

  await stripePost(`/v1/customers/${referrer.stripe_customer_id}/balance_transactions`, {
    amount: String(-amountCents),
    currency: 'chf',
    description: 'Récompense de parrainage ZenFacture : 1 mois offert',
  });

  await supabase
    .from('profils')
    .update({ referral_reward_granted_at: new Date().toISOString() })
    .eq('id', referredProfileId);
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await req.text();
  const sigHeader = req.headers.get('stripe-signature');

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET non configuré — impossible de vérifier la signature.');
    return new Response(JSON.stringify({ error: 'Webhook non configuré côté serveur' }), { status: 503 });
  }

  if (!sigHeader) {
    return new Response(JSON.stringify({ error: 'Signature Stripe manquante' }), { status: 400 });
  }

  const validSignature = await verifyStripeSignature(payload, sigHeader, STRIPE_WEBHOOK_SECRET);
  if (!validSignature) {
    return new Response(JSON.stringify({ error: 'Signature invalide' }), { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          client_reference_id?: string;
          customer?: string;
          subscription?: string;
          metadata?: { organisationId?: string };
        };
        const organisationId = session.client_reference_id || session.metadata?.organisationId;
        if (!organisationId) break;

        let priceId: string | null = null;
        if (session.subscription) {
          const subscription = await stripeGet(`/v1/subscriptions/${session.subscription}`);
          priceId = subscription.items?.data?.[0]?.price?.id ?? null;
        }

        await supabase
          .from('profils')
          .update({
            stripe_customer_id: session.customer ?? null,
            stripe_subscription_id: session.subscription ?? null,
            stripe_price_id: priceId,
            plan_abonnement: planFromPriceId(priceId),
            subscription_status: 'active',
          })
          .eq('id', organisationId);

        try {
          await applyReferralRewardIfNeeded(organisationId);
        } catch (referralErr) {
          console.error('Erreur lors de l\'application de la récompense de parrainage:', referralErr);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as {
          id: string;
          status: string;
          customer: string;
          items?: { data: Array<{ price: { id: string } }> };
          metadata?: { organisationId?: string };
        };
        const priceId = subscription.items?.data?.[0]?.price?.id ?? null;

        const match = subscription.metadata?.organisationId
          ? { column: 'id', value: subscription.metadata.organisationId }
          : { column: 'stripe_customer_id', value: subscription.customer };

        await supabase
          .from('profils')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            plan_abonnement: planFromPriceId(priceId),
            subscription_status: subscription.status,
          })
          .eq(match.column, match.value);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as { id: string; customer: string };

        await supabase
          .from('profils')
          .update({
            plan_abonnement: 'essentiel',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            stripe_price_id: null,
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      default:
        // Événement non géré — on l'ignore silencieusement (200 pour éviter les retries Stripe)
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Erreur stripe-webhook:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
