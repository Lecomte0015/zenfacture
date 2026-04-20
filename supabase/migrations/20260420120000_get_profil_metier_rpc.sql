-- Migration: Fonction RPC pour lire le profil_metier sans RLS
-- Date: 2026-04-20
-- Résout : SELECT profil_metier bloqué par RLS au refresh

CREATE OR REPLACE FUNCTION public.get_my_profil_metier()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id      UUID;
  v_profil      TEXT;
BEGIN
  -- Récupérer l'organisation de l'utilisateur
  SELECT organisation_id INTO v_org_id
  FROM utilisateurs_organisations
  WHERE utilisateur_id = auth.uid()
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Lire le profil_metier
  SELECT profil_metier INTO v_profil
  FROM organisations
  WHERE id = v_org_id;

  RETURN v_profil;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profil_metier() TO authenticated;
