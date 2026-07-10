-- Migration : Bannière d'annonce configurable depuis le back-office
--
-- Étend `platform_settings` (créée dans 20260710000300) avec les champs
-- nécessaires à une bannière d'annonce (texte, image de fond, lien optionnel,
-- activation) affichée sur le site public et le dashboard client.
--
-- Problème d'accès : `platform_settings` n'est aujourd'hui lisible que par
-- les admins (policy platform_settings_select_admin, public.is_admin()).
-- La bannière doit au contraire être visible par TOUT LE MONDE (visiteurs
-- non connectés inclus sur le site public), mais sans exposer le reste de la
-- configuration (SMTP, quotas...) à n'importe qui. Solution : une fonction
-- SECURITY DEFINER dédiée qui ne retourne QUE les colonnes de la bannière,
-- même pattern que public.is_admin() déjà utilisé dans ce projet.

-- ── 1. Nouvelles colonnes ────────────────────────────────────────────────
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS banner_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS banner_text TEXT,
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_link_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_link_label TEXT;

-- ── 2. Bucket Storage pour l'image de fond de la bannière ───────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform-banners',
  'platform-banners',
  true,
  4194304,  -- 4 MB max (image de fond, potentiellement large)
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 4194304,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Lecture publique (la bannière doit s'afficher sans authentification)
DROP POLICY IF EXISTS "platform_banners_select" ON storage.objects;
CREATE POLICY "platform_banners_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'platform-banners');

-- Écriture réservée aux admins/super_admins
DROP POLICY IF EXISTS "platform_banners_insert" ON storage.objects;
CREATE POLICY "platform_banners_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'platform-banners' AND public.is_admin());

DROP POLICY IF EXISTS "platform_banners_update" ON storage.objects;
CREATE POLICY "platform_banners_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'platform-banners' AND public.is_admin())
WITH CHECK (bucket_id = 'platform-banners' AND public.is_admin());

DROP POLICY IF EXISTS "platform_banners_delete" ON storage.objects;
CREATE POLICY "platform_banners_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'platform-banners' AND public.is_admin());

-- ── 3. Fonction publique : lecture de la bannière uniquement ────────────
-- SECURITY DEFINER pour contourner la RLS de platform_settings (qui reste
-- admin-only pour le reste des colonnes) sans jamais exposer smtp_*,
-- max_invoices_*, etc.
CREATE OR REPLACE FUNCTION public.get_announcement_banner()
RETURNS TABLE (
  banner_enabled BOOLEAN,
  banner_text TEXT,
  banner_image_url TEXT,
  banner_link_url TEXT,
  banner_link_label TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT banner_enabled, banner_text, banner_image_url, banner_link_url, banner_link_label
  FROM public.platform_settings
  WHERE id = TRUE;
$$;

-- Exécutable par n'importe qui, connecté ou non (site public inclus)
GRANT EXECUTE ON FUNCTION public.get_announcement_banner() TO anon, authenticated;
