-- Migration: Audit Trail blockchain-like (Phase 7.3)
-- Date: 2026-03-18

CREATE TABLE IF NOT EXISTS audit_trail (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL CHECK (document_type IN ('invoice','expense','devis','avoir','client','produit','organisation')),
  document_id     UUID NOT NULL,
  action          TEXT NOT NULL CHECK (action IN ('create','update','delete','view','send','archive')),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email      TEXT,
  contenu_json    JSONB,
  hash_contenu    TEXT NOT NULL,
  hash_precedent  TEXT,
  hash_chaine     TEXT NOT NULL,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la vérification de la chaîne
CREATE INDEX IF NOT EXISTS idx_audit_trail_org ON audit_trail(organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_doc ON audit_trail(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON audit_trail(user_id);

-- RLS (lecture seule pour les utilisateurs — écriture via service role ou trigger)
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Lecture : membres de l'organisation peuvent lire
CREATE POLICY "audit_trail_read" ON audit_trail
  FOR SELECT USING (
    organisation_id IN (SELECT public.get_user_org_ids())
  );

-- Insertion : tout utilisateur authentifié membre de l'org peut insérer
CREATE POLICY "audit_trail_insert" ON audit_trail
  FOR INSERT WITH CHECK (
    organisation_id IN (SELECT public.get_user_org_ids())
  );
