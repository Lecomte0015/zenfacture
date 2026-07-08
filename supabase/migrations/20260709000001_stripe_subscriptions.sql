-- Migration : Paiement Stripe & abonnements SaaS (Phase 4.3)
-- Date: 2026-07-09
--
-- Contexte : useSubscriptionFeatures.ts et BillingPage.tsx pilotent le plan
-- d'abonnement via profils.plan_abonnement (clé = profils.id = auth.uid()).
-- On ajoute les colonnes nécessaires pour relier un profil à un client et un
-- abonnement Stripe, afin que l'Edge Function stripe-webhook puisse mettre à
-- jour le plan automatiquement après un paiement.

ALTER TABLE public.profils
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'));

CREATE INDEX IF NOT EXISTS idx_profils_stripe_customer_id ON public.profils(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profils_stripe_subscription_id ON public.profils(stripe_subscription_id);

COMMENT ON COLUMN public.profils.stripe_customer_id IS 'ID du client Stripe (cus_...) associé à ce profil';
COMMENT ON COLUMN public.profils.stripe_subscription_id IS 'ID de l''abonnement Stripe (sub_...) actif';
COMMENT ON COLUMN public.profils.stripe_price_id IS 'ID du prix Stripe (price_...) souscrit, sert à retrouver le plan';
COMMENT ON COLUMN public.profils.subscription_status IS 'Statut Stripe brut de l''abonnement (mirror de Stripe subscription.status)';

-- La service_role (Edge Functions / webhook Stripe) doit pouvoir mettre à jour
-- n'importe quel profil pour synchroniser les paiements.
DROP POLICY IF EXISTS "service_role_profils_stripe" ON public.profils;
CREATE POLICY "service_role_profils_stripe" ON public.profils
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
