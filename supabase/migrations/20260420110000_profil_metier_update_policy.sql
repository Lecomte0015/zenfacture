-- Migration: Policy UPDATE pour profil_metier
-- Date: 2026-04-20
-- Résout : RLS bloque la mise à jour du profil_metier par l'utilisateur

-- ── 1. Policy UPDATE sur organisations ──────────────────────────────────────
-- Permet à un membre de l'organisation de mettre à jour sa propre organisation
CREATE POLICY "organisations_update_member"
  ON organisations
  FOR UPDATE
  USING (
    id IN (SELECT public.get_user_org_ids())
  )
  WITH CHECK (
    id IN (SELECT public.get_user_org_ids())
  );

-- ── 2. Fonction SECURITY DEFINER pour update du profil_metier ───────────────
-- Contourne RLS de façon sécurisée : valide le profil ET vérifie l'appartenance
CREATE OR REPLACE FUNCTION public.set_profil_metier(
  p_organisation_id UUID,
  p_profil          TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que le profil est valide
  IF p_profil NOT IN ('commerce','services','freelance','restauration','construction','sante','pme') THEN
    RAISE EXCEPTION 'Profil métier invalide : %', p_profil;
  END IF;

  -- Vérifier que l'utilisateur appartient à cette organisation
  IF NOT EXISTS (
    SELECT 1 FROM utilisateurs_organisations
    WHERE organisation_id = p_organisation_id
      AND utilisateur_id  = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accès refusé à l''organisation %', p_organisation_id;
  END IF;

  -- Mettre à jour
  UPDATE organisations
  SET profil_metier = p_profil
  WHERE id = p_organisation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_profil_metier(UUID, TEXT) TO authenticated;
