-- Phase 5.2 : Archivage 10 ans conforme nLPD
-- Ajouter les colonnes d'archivage sur les tables principales

-- Sur factures (anciennement invoices)
ALTER TABLE public.factures
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archive_expiry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archive_hash TEXT;

-- Sur depenses (anciennement expenses)
ALTER TABLE public.depenses
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archive_expiry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archive_hash TEXT;

-- Sur avoirs (si la table existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avoirs') THEN
    ALTER TABLE public.avoirs
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS archive_expiry_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS archive_hash TEXT;
  END IF;
END $$;

-- Sur devis (si la table existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devis') THEN
    ALTER TABLE public.devis
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS archive_expiry_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS archive_hash TEXT;
  END IF;
END $$;

-- Table centrale des archives pour vue unifiée
CREATE TABLE IF NOT EXISTS public.archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'expense', 'avoir', 'devis')),
  document_id UUID NOT NULL,
  document_number TEXT,
  document_date DATE,
  montant NUMERIC(10,2),
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archive_expiry_at TIMESTAMPTZ NOT NULL,
  archive_hash TEXT NOT NULL,
  archived_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  UNIQUE(document_type, document_id)
);

ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "archives_org" ON public.archives
  FOR ALL USING (
    organisation_id IN (SELECT public.get_user_org_ids())
  );

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_archives_org ON public.archives(organisation_id);
CREATE INDEX IF NOT EXISTS idx_archives_type ON public.archives(document_type);
CREATE INDEX IF NOT EXISTS idx_archives_expiry ON public.archives(archive_expiry_at);

-- Fonction pour archiver un document (appelée depuis le frontend)
CREATE OR REPLACE FUNCTION public.archiver_document(
  p_document_type TEXT,
  p_document_id UUID,
  p_organisation_id UUID,
  p_hash TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_archive_id UUID;
  v_expiry TIMESTAMPTZ := NOW() + INTERVAL '10 years';
  v_doc_number TEXT;
  v_doc_date DATE;
  v_montant NUMERIC;
BEGIN
  -- Récupérer les infos du document selon son type
  IF p_document_type = 'invoice' THEN
    SELECT invoice_number, date::DATE, total
    INTO v_doc_number, v_doc_date, v_montant
    FROM public.factures WHERE id = p_document_id;

    UPDATE public.factures
    SET archived_at = NOW(), archive_expiry_at = v_expiry, archive_hash = p_hash
    WHERE id = p_document_id;

  ELSIF p_document_type = 'expense' THEN
    SELECT description, date::DATE, amount
    INTO v_doc_number, v_doc_date, v_montant
    FROM public.depenses WHERE id = p_document_id;

    UPDATE public.depenses
    SET archived_at = NOW(), archive_expiry_at = v_expiry, archive_hash = p_hash
    WHERE id = p_document_id;
  END IF;

  -- Insérer dans la table archives
  INSERT INTO public.archives (
    organisation_id, document_type, document_id,
    document_number, document_date, montant,
    archive_expiry_at, archive_hash, archived_by, metadata
  ) VALUES (
    p_organisation_id, p_document_type, p_document_id,
    v_doc_number, v_doc_date, v_montant,
    v_expiry, p_hash, auth.uid(), p_metadata
  )
  ON CONFLICT (document_type, document_id) DO UPDATE
    SET archive_hash = p_hash, archived_at = NOW(), archive_expiry_at = v_expiry
  RETURNING id INTO v_archive_id;

  RETURN v_archive_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
