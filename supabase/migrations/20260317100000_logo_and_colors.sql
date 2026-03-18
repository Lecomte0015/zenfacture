-- ============================================================
-- Migration: Logo et couleurs de personnalisation des factures
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Ajouter les colonnes de personnalisation à la table organisations
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2563EB',
  ADD COLUMN IF NOT EXISTS header_bg_color TEXT DEFAULT '#F3F4F6';

-- 2. Créer le bucket Storage pour les logos (public = accessible sans auth pour l'affichage)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-logos',
  'org-logos',
  true,
  2097152,  -- 2 MB max
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];

-- 3. Politique : les utilisateurs peuvent uploader leur propre logo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'org_logos_insert'
  ) THEN
    CREATE POLICY "org_logos_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'org-logos');
  END IF;
END $$;

-- 4. Politique : les logos sont publiquement lisibles (pour affichage sur factures)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'org_logos_select'
  ) THEN
    CREATE POLICY "org_logos_select"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'org-logos');
  END IF;
END $$;

-- 5. Politique : les utilisateurs peuvent mettre à jour leur logo (upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'org_logos_update'
  ) THEN
    CREATE POLICY "org_logos_update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'org-logos');
  END IF;
END $$;

-- 6. Politique : les utilisateurs peuvent supprimer leur logo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'org_logos_delete'
  ) THEN
    CREATE POLICY "org_logos_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'org-logos');
  END IF;
END $$;

-- Confirmation
SELECT 'Migration logo_and_colors appliquée avec succès ✓' AS status;
