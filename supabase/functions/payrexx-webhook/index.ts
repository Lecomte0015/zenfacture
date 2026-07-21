/**
 * Edge Function : payrexx-webhook
 * Reçoit les notifications de paiement Payrexx pour les liens de paiement
 * de factures (voir create-payment-link/index.ts et payrexxService.ts).
 *
 * Payrexx ne fournit pas de signature HMAC sur ses webhooks (contrairement à
 * Stripe) — voir https://developers.payrexx.com/docs/webhooks. La pratique
 * recommandée est donc de ne jamais faire confiance au contenu du webhook :
 * on ne récupère que l'ID de transaction depuis la requête, puis on
 * revérifie la transaction directement auprès de l'API Payrexx avec notre
 * propre clé API (authentifiée), et on agit uniquement sur cette donnée
 * vérifiée.
 *
 * Configuration requise (secrets Supabase, identiques à create-payment-link) :
 *   PAYREXX_INSTANCE — Nom de l'instance Payrexx
 *   PAYREXX_API_KEY  — Clé API Payrexx
 *
 * Configuration côté Payrexx (Dashboard → Réglages → API → Webhook) :
 *   URL          : https://<votre-projet>.supabase.co/functions/v1/payrexx-webhook
 *   Content-Type : JSON (impératif — cette fonction ne gère pas le format
 *                  "Normal / PHP-Post" en application/x-www-form-urlencoded)
 *   Événements   : Transaction (waiting, confirmed, cancelled, declined, refunded...)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const PAYREXX_INSTANCE = Deno.env.get('PAYREXX_INSTANCE') ?? '';
const PAYREXX_API_KEY = Deno.env.get('PAYREXX_API_KEY') ?? '';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Convertit un statut de transaction Payrexx en statut interne payment_links.
 * Renvoie null pour les statuts intermédiaires/non actionnables.
 */
function mapPayrexxStatus(status: string): 'paid' | 'active' | 'cancelled' | null {
  switch (status) {
    case 'confirmed':
    case 'refunded':
    case 'partially-refunded':
      // Le paiement a bien eu lieu (un remboursement reste un paiement
      // initialement effectué — à affiner plus tard si un statut dédié
      // "remboursé" est nécessaire côté comptabilité).
      return 'paid';
    case 'waiting':
    case 'authorized':
    case 'reserved':
      return 'active';
    case 'cancelled':
    case 'declined':
    case 'error':
      return 'cancelled';
    default:
      return null;
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!PAYREXX_INSTANCE || !PAYREXX_API_KEY) {
    console.error('PAYREXX_INSTANCE / PAYREXX_API_KEY non configurés.');
    return new Response(JSON.stringify({ error: 'Payrexx non configuré côté serveur' }), { status: 503 });
  }

  let payload: { transaction?: { id?: number | string } };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide (configurez le webhook Payrexx en Content-Type JSON)' }), { status: 400 });
  }

  const transactionId = payload.transaction?.id;
  if (!transactionId) {
    // Payload inattendu — on répond 200 pour ne pas déclencher de retries
    // infinis de la part de Payrexx sur un événement qu'on ne sait pas traiter.
    return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200 });
  }

  try {
    // Ne jamais faire confiance au contenu du webhook : on revérifie la
    // transaction directement auprès de Payrexx avec notre propre clé API.
    const verifyResponse = await fetch(
      `https://api.payrexx.com/v1.0/Transaction/${transactionId}/?instance=${encodeURIComponent(PAYREXX_INSTANCE)}&ApiSignature=${encodeURIComponent(PAYREXX_API_KEY)}`
    );

    if (!verifyResponse.ok) {
      throw new Error(`Vérification Payrexx échouée (HTTP ${verifyResponse.status})`);
    }

    const verifyBody = await verifyResponse.json();
    // L'API Payrexx enveloppe généralement le résultat dans { status, data: [...] } ;
    // on gère aussi le cas où l'objet transaction serait renvoyé directement.
    const transaction = Array.isArray(verifyBody?.data) ? verifyBody.data[0] : (verifyBody?.data ?? verifyBody);

    if (!transaction || typeof transaction !== 'object') {
      throw new Error('Transaction introuvable chez Payrexx');
    }

    const referenceId: string | undefined = transaction.referenceId;
    const payrexxStatus: string | undefined = transaction.status;
    const internalStatus = payrexxStatus ? mapPayrexxStatus(payrexxStatus) : null;

    if (!internalStatus) {
      // Statut intermédiaire non actionnable (ex: déjà "waiting") — 200 pour
      // éviter que Payrexx ne retente indéfiniment.
      return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200 });
    }

    const paymentMethod: string | null = transaction.payment?.wallet || transaction.payment?.brand || null;

    // Retrouver le lien de paiement correspondant : par external_id (déjà lié
    // lors d'un précédent webhook) ou, à défaut, par le numéro de facture
    // transmis comme referenceId à la création du lien.
    let query = supabase
      .from('payment_links')
      .select('id, invoice_id')
      .order('created_at', { ascending: false })
      .limit(1);

    query = referenceId
      ? query.or(`external_id.eq.${transactionId},invoice_number.eq.${referenceId}`)
      : query.eq('external_id', String(transactionId));

    const { data: link } = await query.maybeSingle();

    if (!link) {
      console.warn(`Aucun payment_link trouvé pour la transaction Payrexx ${transactionId} (referenceId: ${referenceId ?? 'inconnu'})`);
      return new Response(JSON.stringify({ received: true, matched: false }), { status: 200 });
    }

    await supabase
      .from('payment_links')
      .update({
        status: internalStatus,
        external_id: String(transactionId),
        external_transaction_id: String(transactionId),
        payment_method: paymentMethod,
        ...(internalStatus === 'paid' ? { paid_at: new Date().toISOString() } : {}),
      })
      .eq('id', link.id);

    if (internalStatus === 'paid' && link.invoice_id) {
      await supabase
        .from('factures')
        .update({ status: 'paid' })
        .eq('id', link.invoice_id);
    }

    return new Response(JSON.stringify({ received: true, matched: true, status: internalStatus }), { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Erreur payrexx-webhook:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
