-- Migration : Isolation cross-tenant du bucket Storage "org-logos"
-- Contexte (audit sécurité 2026-07-08) : les policies INSERT/UPDATE/DELETE créées
-- dans 20260317100000_logo_and_colors.sql ne vérifient que `bucket_id = 'org-logos'`,
-- sans filtrer par dossier. Le chemin d'upload utilisé côté frontend
-- (src/pages/SettingsPage.tsx) est `${organisationId}/logo.${ext}`, donc n'importe
-- quel utilisateur authentifié pouvait écraser ou supprimer le logo de n'importe
-- quelle AUTRE organisation (sabotage cross-tenant), même si la lecture reste bien
-- publique par conception (logo affiché sur les factures/portail client).
--
-- Cette migration remplace ces 3 policies par une version qui vérifie que le
-- premier segment du chemin (le dossier = organisation_id) correspond à une
-- organisation de l'utilisateur courant, via la fonction existante
-- public.get_user_org_ids() (même fonction déjà utilisée par les policies RLS
-- applicatives, SECURITY DEFINER, sans risque d'injection).
--
-- La policy SELECT (lecture publique) n'est volontairement PAS modifiée : elle
-- est publique par design.

DROP POLICY IF EXISTS "org_logos_insert" ON storage.objects;
DROP POLICY IF EXISTS "org_logos_update" ON storage.objects;
DROP POLICY IF EXISTS "org_logos_delete" ON storage.objects;

CREATE POLICY "org_logos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (SELECT gid::text FROM public.get_user_org_ids() AS gid)
);

CREATE POLICY "org_logos_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (SELECT gid::text FROM public.get_user_org_ids() AS gid)
)
WITH CHECK (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (SELECT gid::text FROM public.get_user_org_ids() AS gid)
);

CREATE POLICY "org_logos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (SELECT gid::text FROM public.get_user_org_ids() AS gid)
);
