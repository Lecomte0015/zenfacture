-- Migration : Bannière "hero" de la page d'accueil configurable depuis le
-- back-office (texte, couleurs, image de fond).
--
-- Corrige au passage un bug visible sur le site public : HomePage.tsx
-- affichait en dur <img src="/image/hi.jpg" /> alors que ce fichier n'existe
-- pas dans public/ — d'où l'icône d'image cassée visible sur le hero. Cette
-- migration ajoute une image de fond optionnelle réellement gérée (upload
-- depuis AdminSettingsPage, bucket Storage), avec repli sur une couleur de
-- fond unie quand aucune image n'est configurée.
--
-- Même pattern que 20260710000400_announcement_banner.sql : les colonnes
-- hero_* sont exposées publiquement (site non authentifié) via une fonction
-- SECURITY DEFINER dédiée, sans toucher aux policies RLS admin-only du reste
-- de `platform_settings`.

-- ── 1. Nouvelles colonnes ────────────────────────────────────────────────
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS hero_title TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS hero_cta_label TEXT,
  ADD COLUMN IF NOT EXISTS hero_cta_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_secondary_cta_label TEXT,
  ADD COLUMN IF NOT EXISTS hero_secondary_cta_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_bg_color TEXT,
  ADD COLUMN IF NOT EXISTS hero_text_color TEXT,
  ADD COLUMN IF NOT EXISTS hero_button_bg_color TEXT,
  ADD COLUMN IF NOT EXISTS hero_button_text_color TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- ── 2. Bucket Storage pour l'image de fond du hero ──────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform-hero',
  'platform-hero',
  true,
  4194304,  -- 4 MB max
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 4194304,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

DROP POLICY IF EXISTS "platform_hero_select" ON storage.objects;
CREATE POLICY "platform_hero_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'platform-hero');

DROP POLICY IF EXISTS "platform_hero_insert" ON storage.objects;
CREATE POLICY "platform_hero_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'platform-hero' AND public.is_admin());

DROP POLICY IF EXISTS "platform_hero_update" ON storage.objects;
CREATE POLICY "platform_hero_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'platform-hero' AND public.is_admin())
WITH CHECK (bucket_id = 'platform-hero' AND public.is_admin());

DROP POLICY IF EXISTS "platform_hero_delete" ON storage.objects;
CREATE POLICY "platform_hero_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'platform-hero' AND public.is_admin());

-- ── 3. Fonction publique : lecture du hero uniquement ───────────────────
CREATE OR REPLACE FUNCTION public.get_homepage_hero()
RETURNS TABLE (
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_cta_label TEXT,
  hero_cta_url TEXT,
  hero_secondary_cta_label TEXT,
  hero_secondary_cta_url TEXT,
  hero_bg_color TEXT,
  hero_text_color TEXT,
  hero_button_bg_color TEXT,
  hero_button_text_color TEXT,
  hero_image_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT hero_title, hero_subtitle, hero_cta_label, hero_cta_url,
         hero_secondary_cta_label, hero_secondary_cta_url,
         hero_bg_color, hero_text_color, hero_button_bg_color, hero_button_text_color,
         hero_image_url
  FROM public.platform_settings
  WHERE id = TRUE;
$$;

GRANT EXECUTE ON FUNCTION public.get_homepage_hero() TO anon, authenticated;
