-- ============================================================
-- Migration : table payment_links
-- Date       : 2026-03-13
-- Description: Stocke les liens de paiement en ligne créés via
--              Payrexx ou Stripe pour les factures ZenFacture.
-- ============================================================

-- Table principale
CREATE TABLE IF NOT EXISTS public.payment_links (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id              UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  invoice_number          TEXT NOT NULL,
  -- Fournisseur de paiement : 'payrexx' | 'stripe'
  provider                TEXT NOT NULL DEFAULT 'payrexx',
  -- URL de paiement partagée avec le client
  payment_url             TEXT NOT NULL,
  -- ID de la session/gateway chez le prestataire
  external_id             TEXT,
  -- ID de la transaction une fois payé
  external_transaction_id TEXT,
  -- Montant en centimes (ex: 15050 = CHF 150.50)
  amount_cents            INTEGER NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'CHF',
  -- Statut : pending | active | paid | expired | cancelled
  status                  TEXT NOT NULL DEFAULT 'pending',
  -- Méthode utilisée (twint, visa, postfinance, etc.)
  payment_method          TEXT,
  -- Timestamps
  expires_at              TIMESTAMPTZ,
  paid_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_payment_links_invoice_id ON public.payment_links(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON public.payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_external_id ON public.payment_links(external_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_payment_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payment_links_updated_at ON public.payment_links;
CREATE TRIGGER set_payment_links_updated_at
  BEFORE UPDATE ON public.payment_links
  FOR EACH ROW EXECUTE FUNCTION update_payment_links_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────────────────
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne voient que les liens de leurs propres factures
-- Utilise la fonction RPC existante get_user_org_ids() (définie dans fix_rls_definitive)
CREATE POLICY "users_own_payment_links" ON public.payment_links
  FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM public.factures
      WHERE organisation_id IN (SELECT public.get_user_org_ids())
    )
  );

-- La service_role (Edge Functions) peut tout faire
CREATE POLICY "service_role_payment_links" ON public.payment_links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Vue utilitaire ─────────────────────────────────────────────────────────────
-- Joindre les infos de facture pour les webhooks
CREATE OR REPLACE VIEW public.payment_links_with_invoice AS
SELECT
  pl.*,
  f.invoice_number AS facture_number,
  f.client_name,
  f.client_email,
  f.total,
  f.devise,
  f.organisation_id
FROM public.payment_links pl
JOIN public.factures f ON f.id = pl.invoice_id;

COMMENT ON TABLE public.payment_links IS
  'Liens de paiement en ligne (Payrexx/Stripe) associés aux factures. Mis à jour par les webhooks.';
