-- =====================================================
-- FIX DEFINITIF : RLS utilisateurs_organisations
-- =====================================================
-- Ce script :
-- 1. Crée une fonction RPC SECURITY DEFINER pour récupérer l'organisation
-- 2. Supprime TOUTES les policies existantes sur utilisateurs_organisations
-- 3. Recrée des policies simples sans récursion
-- =====================================================

-- 1. Fonction RPC pour récupérer l'organisation_id du user connecté
-- (SECURITY DEFINER = s'exécute en tant que propriétaire, bypasse RLS)
CREATE OR REPLACE FUNCTION public.get_my_organisation_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id
  FROM utilisateurs_organisations
  WHERE utilisateur_id = auth.uid()
  LIMIT 1;
$$;

-- Fonction pour récupérer toutes les organisations du user
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id
  FROM utilisateurs_organisations
  WHERE utilisateur_id = auth.uid();
$$;

-- Fonction pour vérifier si le user est admin d'une org
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM utilisateurs_organisations
    WHERE organisation_id = org_id
    AND utilisateur_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. Supprimer TOUTES les policies existantes sur utilisateurs_organisations
-- (on liste tous les noms possibles créés par les différentes migrations)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'utilisateurs_organisations' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.utilisateurs_organisations', pol.policyname);
  END LOOP;
END $$;

-- 3. Recréer des policies simples (PAS de sous-requête sur la même table!)
CREATE POLICY "uo_select_own" ON public.utilisateurs_organisations
  FOR SELECT USING (utilisateur_id = auth.uid());

CREATE POLICY "uo_insert_admin" ON public.utilisateurs_organisations
  FOR INSERT WITH CHECK (public.is_org_admin(organisation_id));

CREATE POLICY "uo_update_admin" ON public.utilisateurs_organisations
  FOR UPDATE USING (public.is_org_admin(organisation_id));

CREATE POLICY "uo_delete_admin" ON public.utilisateurs_organisations
  FOR DELETE USING (public.is_org_admin(organisation_id));

-- 4. Réparer organisations table
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'organisations' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organisations', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "org_select" ON public.organisations
  FOR SELECT USING (id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "org_update_admin" ON public.organisations
  FOR UPDATE USING (public.is_org_admin(id));

-- 5. Réparer toutes les tables Phase 2 et 3 qui ont organisation_id
DO $$
DECLARE
  tbl TEXT;
  all_tables TEXT[] := ARRAY[
    -- Phase 2
    'clients', 'produits', 'factures', 'depenses', 'devis', 'avoirs',
    'lignes_facture', 'lignes_devis', 'rappels', 'factures_recurrentes',
    'cles_api', 'tickets', 'invitations_organisation',
    -- Phase 3
    'ocr_scans', 'comptes_bancaires', 'transactions_bancaires', 'fichiers_bancaires',
    'plan_comptable', 'exercices_comptables', 'ecritures_comptables',
    'declarations_tva', 'ebill_config', 'ebill_envois',
    'acces_fiduciaire', 'exports_fiduciaire', 'imports'
  ];
  pol RECORD;
  has_org_col BOOLEAN;
  has_rls BOOLEAN;
BEGIN
  FOREACH tbl IN ARRAY all_tables LOOP
    -- Vérifier si la table existe et a une colonne organisation_id
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'organisation_id'
    ) INTO has_org_col;

    IF NOT has_org_col THEN
      CONTINUE;
    END IF;

    -- Supprimer TOUTES les policies existantes sur cette table
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
    END LOOP;

    -- Activer RLS si pas déjà activé
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- Créer les policies avec la fonction SECURITY DEFINER
    IF tbl = 'plan_comptable' THEN
      -- Cas spécial : plan_comptable a des comptes système visibles par tous
      EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (
        est_systeme = true OR organisation_id IN (SELECT public.get_user_org_ids())
      )', tbl, tbl);
      EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (
        organisation_id IN (SELECT public.get_user_org_ids())
      )', tbl, tbl);
      EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (
        est_systeme = false AND organisation_id IN (SELECT public.get_user_org_ids())
      )', tbl, tbl);
      EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (
        est_systeme = false AND organisation_id IN (SELECT public.get_user_org_ids())
      )', tbl, tbl);
    ELSE
      -- Cas standard
      EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (
        organisation_id IN (SELECT public.get_user_org_ids())
      )', tbl, tbl);
      EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (
        organisation_id IN (SELECT public.get_user_org_ids())
      )', tbl, tbl);
      EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (
        organisation_id IN (SELECT public.get_user_org_ids())
      )', tbl, tbl);
      EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (
        organisation_id IN (SELECT public.get_user_org_ids())
      )', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- 6. Aussi réparer la table profils (pas d'organisation_id, mais id = user id)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'profils' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profils', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE IF EXISTS public.profils ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profils_select_own" ON public.profils
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profils_insert_own" ON public.profils
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profils_update_own" ON public.profils
  FOR UPDATE USING (id = auth.uid());

-- =====================================================
-- FIN
-- =====================================================
