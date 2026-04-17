-- Migration: Signature Électronique (Phase 8.4)
-- Envoi de documents (devis, contrats) pour signature en ligne via lien token unique

CREATE TABLE IF NOT EXISTS signature_demandes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_type         TEXT NOT NULL CHECK (document_type IN ('devis','facture','contrat')),
  document_id           UUID NOT NULL,
  document_titre        TEXT NOT NULL,
  signataire_nom        TEXT NOT NULL,
  signataire_email      TEXT NOT NULL,
  token                 TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  statut                TEXT NOT NULL DEFAULT 'en_attente'
                        CHECK (statut IN ('en_attente','vu','signe','refuse','expire')),
  message_personnalise  TEXT,
  signature_data        TEXT,       -- SVG path en base64
  signature_type        TEXT DEFAULT 'dessinee' CHECK (signature_type IN ('dessinee','tapee')),
  nom_signe             TEXT,       -- Nom tapé lors de la signature
  ip_signataire         TEXT,
  user_agent_signataire TEXT,
  signe_at              TIMESTAMPTZ,
  vu_at                 TIMESTAMPTZ,
  refuse_raison         TEXT,
  expires_at            TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  rappel_envoye_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signature_demandes_org    ON signature_demandes(organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signature_demandes_token  ON signature_demandes(token) WHERE statut != 'expire';
CREATE INDEX IF NOT EXISTS idx_signature_demandes_docid  ON signature_demandes(document_id, document_type);

ALTER TABLE signature_demandes ENABLE ROW LEVEL SECURITY;

-- Les membres de l'organisation gèrent leurs demandes
CREATE POLICY "signature_demandes_org" ON signature_demandes
  FOR ALL USING (
    organisation_id IN (
      SELECT organisation_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Accès public en lecture via token (page de signature publique)
CREATE POLICY "signature_demandes_public_read" ON signature_demandes
  FOR SELECT USING (token IS NOT NULL AND expires_at > NOW());

-- Accès public en écriture pour la signature (UPDATE uniquement sur colonnes autorisées)
-- On gère ça via une Edge Function pour plus de sécurité
