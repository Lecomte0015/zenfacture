-- Migration: CRM Pipeline (Phase 8.2)
-- Gestion des opportunités commerciales avec pipeline Kanban

CREATE TABLE IF NOT EXISTS crm_opportunites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nom              TEXT NOT NULL,
  client_id        UUID,  -- Référence optionnelle à la table clients
  client_nom       TEXT,
  client_email     TEXT,
  valeur           NUMERIC(12,2) NOT NULL DEFAULT 0,
  devise           TEXT NOT NULL DEFAULT 'CHF',
  stade            TEXT NOT NULL DEFAULT 'prospect'
                   CHECK (stade IN ('prospect','contact','devis_envoye','negociation','gagne','perdu')),
  probabilite      INTEGER NOT NULL DEFAULT 50 CHECK (probabilite BETWEEN 0 AND 100),
  date_fermeture   DATE,
  description      TEXT,
  raison_perte     TEXT,
  devis_id         UUID,  -- Lien vers devis généré
  ordre            INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunite_id   UUID NOT NULL REFERENCES crm_opportunites(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('appel','email','reunion','note','devis','relance','autre')),
  titre            TEXT NOT NULL,
  description      TEXT,
  date_activite    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_opportunites_org   ON crm_opportunites(organisation_id, stade);
CREATE INDEX IF NOT EXISTS idx_crm_opportunites_stade ON crm_opportunites(stade, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activites_opp      ON crm_activites(opportunite_id, date_activite DESC);

CREATE OR REPLACE FUNCTION update_crm_opportunites_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crm_opportunites_updated_at
  BEFORE UPDATE ON crm_opportunites
  FOR EACH ROW EXECUTE FUNCTION update_crm_opportunites_updated_at();

ALTER TABLE crm_opportunites ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activites    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_opportunites_org" ON crm_opportunites
  FOR ALL USING (
    organisation_id IN (
      SELECT organisation_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "crm_activites_org" ON crm_activites
  FOR ALL USING (
    opportunite_id IN (
      SELECT id FROM crm_opportunites
      WHERE organisation_id IN (
        SELECT organisation_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  );
