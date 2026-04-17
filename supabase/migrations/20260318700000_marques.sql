-- Migration: Multi-marques / White-labeling (Phase 6.4)
-- Date: 2026-03-18

CREATE TABLE IF NOT EXISTS marques (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  nom             TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  logo_url        TEXT,
  couleur_primaire TEXT NOT NULL DEFAULT '#2563EB',
  couleur_secondaire TEXT DEFAULT '#64748B',
  police          TEXT DEFAULT 'Inter',
  adresse         TEXT,
  email           TEXT,
  telephone       TEXT,
  site_web        TEXT,
  mentions_legales TEXT,
  conditions_paiement TEXT,
  pied_facture    TEXT,
  actif           BOOLEAN NOT NULL DEFAULT TRUE,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, slug)
);

-- Colonne marque_id sur les factures
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS marque_id UUID REFERENCES marques(id) ON DELETE SET NULL;

-- Colonne marque_id sur les devis
ALTER TABLE devis ADD COLUMN IF NOT EXISTS marque_id UUID REFERENCES marques(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marques_org ON marques(organisation_id);
CREATE INDEX IF NOT EXISTS idx_invoices_marque ON invoices(marque_id);

-- RLS
ALTER TABLE marques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marques_org" ON marques
  FOR ALL USING (
    organisation_id IN (SELECT public.get_user_org_ids())
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_marques_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marques_updated_at
  BEFORE UPDATE ON marques
  FOR EACH ROW EXECUTE FUNCTION update_marques_updated_at();

-- Insérer une marque par défaut basée sur l'organisation principale
-- (à faire via l'interface)
