-- Migration: Envois postaux (Phase 7.1)
-- Date: 2026-03-18

CREATE TABLE IF NOT EXISTS envois_postaux (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id    UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  invoice_id         UUID REFERENCES factures(id) ON DELETE SET NULL,
  type               TEXT NOT NULL CHECK (type IN ('lettre_a','lettre_b','recommande','epost')),
  statut             TEXT NOT NULL DEFAULT 'en_preparation' CHECK (statut IN ('en_preparation','envoye','en_transit','distribue','echec')),
  destinataire       JSONB NOT NULL,
  expediteur         JSONB NOT NULL,
  nombre_pages       INTEGER NOT NULL DEFAULT 1,
  couleur            BOOLEAN NOT NULL DEFAULT FALSE,
  tracking_number    TEXT,
  prix_centimes      INTEGER NOT NULL DEFAULT 0,
  reference_externe  TEXT,
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_envois_postaux_org ON envois_postaux(organisation_id);
CREATE INDEX IF NOT EXISTS idx_envois_postaux_invoice ON envois_postaux(invoice_id);

ALTER TABLE envois_postaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "envois_postaux_org" ON envois_postaux
  FOR ALL USING (
    organisation_id IN (SELECT public.get_user_org_ids())
  );

CREATE TRIGGER trg_envois_postaux_updated_at
  BEFORE UPDATE ON envois_postaux
  FOR EACH ROW EXECUTE FUNCTION update_marques_updated_at();
