-- Le back-office (/dashboard/admin/organisations, AdminDashboard) interroge
-- directement les tables organisations / utilisateurs_organisations / factures
-- avec la session du super_admin connecté, sans RPC SECURITY DEFINER.
-- Ces tables n'avaient de policy SELECT que basée sur l'appartenance à
-- l'organisation (get_user_org_ids()), sans exception pour is_admin() —
-- contrairement à `profils` qui a déjà `profils_select_admin`.
-- Résultat : un super_admin ne voyait que les organisations dont il est
-- lui-même membre (0 à 5 sur les 12 existantes), pas la liste complète des
-- clients de la plateforme, et les compteurs (factures, utilisateurs) par
-- organisation retombaient à 0 pour toute organisation dont il n'est pas membre.

CREATE POLICY organisations_select_admin ON public.organisations
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY utilisateurs_organisations_select_admin ON public.utilisateurs_organisations
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY factures_select_admin ON public.factures
  FOR SELECT
  USING (public.is_admin());
