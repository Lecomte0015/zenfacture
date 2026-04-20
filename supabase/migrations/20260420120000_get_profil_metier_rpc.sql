-- Migration: Fonction RPC pour lire le profil_metier sans RLS
-- Date: 2026-04-20
-- Résout : SELECT profil_metier bloqué par RLS au refresh

CREATE OR REPLACE FUNCTION public.get_my_profil_metier()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.profil_metier
  FROM organisations o
  JOIN utilisateurs_organisations uo ON uo.organisation_id = o.id
  WHERE uo.utilisateur_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profil_metier() TO authenticated;
