-- Migration: Portail Client (Phase 8.1)
-- Liens sécurisés (token) permettant au client de voir/télécharger/payer ses documents sans compte

CREATE TABLE IF NOT EXISTS portail_client_liens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_email     TEXT NOT NULL,
  client_nom       TEXT,
  token            TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days',
  dernier_acces    TIMESTAMPTZ,
  nb_acces         INTEGER NOT NULL DEFAULT 0,
  actif            BOOLEAN NOT NULL DEFAULT TRUE,
  message_accueil  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portail_client_liens_org   ON portail_client_liens(organisation_id);
CREATE INDEX IF NOT EXISTS idx_portail_client_liens_token ON portail_client_liens(token) WHERE actif = TRUE;
CREATE INDEX IF NOT EXISTS idx_portail_client_liens_email ON portail_client_liens(client_email);

ALTER TABLE portail_client_liens ENABLE ROW LEVEL SECURITY;

-- Seuls les membres de l'organisation peuvent gérer les liens
CREATE POLICY "portail_liens_org" ON portail_client_liens
  FOR ALL USING (
    organisation_id IN (
      SELECT organisation_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Accès public en SELECT via token (pour la page publique)
CREATE POLICY "portail_liens_public_read" ON portail_client_liens
  FOR SELECT USING (actif = TRUE AND expires_at > NOW());
