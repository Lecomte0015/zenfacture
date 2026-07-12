-- Migration : hero avec choix du type de média — image unique (existant),
-- carrousel de plusieurs images, ou vidéo de fond.

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS hero_media_type TEXT NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS hero_carousel_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hero_video_url TEXT;

ALTER TABLE public.platform_settings
  DROP CONSTRAINT IF EXISTS platform_settings_hero_media_type_check;
ALTER TABLE public.platform_settings
  ADD CONSTRAINT platform_settings_hero_media_type_check
  CHECK (hero_media_type IN ('image', 'carousel', 'video'));

-- ── Bucket Storage pour les vidéos de fond du hero ──────────────────────
-- Les vidéos sont bien plus lourdes que des images : limite plus généreuse
-- mais raisonnable (20 Mo) pour éviter qu'un admin n'uploade un fichier brut
-- non compressé de plusieurs centaines de Mo (aucune compression vidéo
-- côté navigateur n'est faite ici, contrairement aux images — l'admin doit
-- fournir un fichier déjà compressé, ou renseigner une URL externe à la
-- place de l'upload).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform-hero-videos',
  'platform-hero-videos',
  true,
  20971520,  -- 20 MB
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm'];

DROP POLICY IF EXISTS "platform_hero_videos_select" ON storage.objects;
CREATE POLICY "platform_hero_videos_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'platform-hero-videos');

DROP POLICY IF EXISTS "platform_hero_videos_insert" ON storage.objects;
CREATE POLICY "platform_hero_videos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'platform-hero-videos' AND public.is_admin());

DROP POLICY IF EXISTS "platform_hero_videos_update" ON storage.objects;
CREATE POLICY "platform_hero_videos_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'platform-hero-videos' AND public.is_admin())
WITH CHECK (bucket_id = 'platform-hero-videos' AND public.is_admin());

DROP POLICY IF EXISTS "platform_hero_videos_delete" ON storage.objects;
CREATE POLICY "platform_hero_videos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'platform-hero-videos' AND public.is_admin());

-- ── Fonction publique : remplace get_homepage_hero() avec les nouveaux champs
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
  hero_image_url TEXT,
  hero_media_type TEXT,
  hero_carousel_urls TEXT[],
  hero_video_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT hero_title, hero_subtitle, hero_cta_label, hero_cta_url,
         hero_secondary_cta_label, hero_secondary_cta_url,
         hero_bg_color, hero_text_color, hero_button_bg_color, hero_button_text_color,
         hero_image_url, hero_media_type, hero_carousel_urls, hero_video_url
  FROM public.platform_settings
  WHERE id = TRUE;
$$;

GRANT EXECUTE ON FUNCTION public.get_homepage_hero() TO anon, authenticated;
