-- ============================================================
-- POLICIES STORAGE pour le bucket photo.profil
-- ============================================================

-- Permettre aux utilisateurs authentifiés d'uploader dans leur propre dossier
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photo.profil'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre aux utilisateurs authentifiés de mettre à jour leur avatar (upsert)
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photo.profil'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'photo.profil'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre aux utilisateurs authentifiés de supprimer leur avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photo.profil'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre à tout le monde de lire les avatars (accès public)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photo.profil');
