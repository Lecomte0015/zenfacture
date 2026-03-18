-- Migration: Point de Vente (POS) (Phase 7.4)
-- Date: 2026-03-18

CREATE TABLE IF NOT EXISTS ventes_pos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  numero            TEXT NOT NULL,
  lignes            JSONB NOT NULL DEFAULT '[]',
  total_ht          NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_tva         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ttc         NUMERIC(12,2) NOT NULL DEFAULT 0,
  remise_totale     NUMERIC(12,2) NOT NULL DEFAULT 0,
  mode_paiement     TEXT NOT NULL CHECK (mode_paiement IN ('especes','carte','twint','virement','bon')),
  montant_recu      NUMERIC(12,2),
  monnaie_rendue    NUMERIC(12,2),
  client_id         UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_nom        TEXT,
  invoice_id        UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ventes_pos_org ON ventes_pos(organisation_id, created_at DESC);

ALTER TABLE ventes_pos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventes_pos_org" ON ventes_pos
  FOR ALL USING (
    organisation_id IN (
      SELECT organisation_id FROM organization_users WHERE user_id = auth.uid()
    )
  );
