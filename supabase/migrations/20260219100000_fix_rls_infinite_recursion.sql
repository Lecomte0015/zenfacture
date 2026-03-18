-- =====================================================
-- Fix: Infinite recursion in RLS policies
-- =====================================================
-- Problem: Phase 3 policies query utilisateurs_organisations,
-- which has its own RLS policies that self-reference, causing
-- PostgreSQL error 42P17 (infinite recursion).
--
-- Solution: Create a SECURITY DEFINER function that bypasses RLS
-- to get user organization IDs, then update all policies to use it.
-- =====================================================

-- 1. Create SECURITY DEFINER function to get user's organization IDs
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

-- 2. Fix utilisateurs_organisations own policies (remove self-referencing)
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs appartenances aux organisations" ON public.utilisateurs_organisations;
DROP POLICY IF EXISTS "Les administrateurs peuvent ajouter des membres" ON public.utilisateurs_organisations;

-- Simple policy: users can see rows where they are the user
CREATE POLICY "utilisateurs_organisations_select" ON public.utilisateurs_organisations
  FOR SELECT USING (utilisateur_id = auth.uid());

-- Admins can insert: use the security definer function to check admin role
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

CREATE POLICY "utilisateurs_organisations_insert" ON public.utilisateurs_organisations
  FOR INSERT WITH CHECK (public.is_org_admin(organisation_id));

-- 3. Fix organisations table policies
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs organisations" ON public.organisations;

CREATE POLICY "organisations_select" ON public.organisations
  FOR SELECT USING (id IN (SELECT public.get_user_org_ids()));

-- 4. Update all Phase 3 table policies to use the function
DO $$
DECLARE
  tables_list TEXT[] := ARRAY[
    'ocr_scans','comptes_bancaires','transactions_bancaires','fichiers_bancaires',
    'exercices_comptables','ecritures_comptables','declarations_tva',
    'ebill_config','ebill_envois','acces_fiduciaire','exports_fiduciaire','imports'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_list LOOP
    -- Drop old policies
    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON %I', t, t);

    -- Create new policies using the security definer function
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (
      organisation_id IN (SELECT public.get_user_org_ids())
    )', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (
      organisation_id IN (SELECT public.get_user_org_ids())
    )', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (
      organisation_id IN (SELECT public.get_user_org_ids())
    )', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (
      organisation_id IN (SELECT public.get_user_org_ids())
    )', t, t);
  END LOOP;
END $$;

-- 5. Fix plan_comptable policies
DROP POLICY IF EXISTS "plan_comptable_select" ON plan_comptable;
DROP POLICY IF EXISTS "plan_comptable_insert" ON plan_comptable;
DROP POLICY IF EXISTS "plan_comptable_update" ON plan_comptable;
DROP POLICY IF EXISTS "plan_comptable_delete" ON plan_comptable;

CREATE POLICY "plan_comptable_select" ON plan_comptable FOR SELECT USING (
  est_systeme = true OR organisation_id IN (SELECT public.get_user_org_ids())
);
CREATE POLICY "plan_comptable_insert" ON plan_comptable FOR INSERT WITH CHECK (
  organisation_id IN (SELECT public.get_user_org_ids())
);
CREATE POLICY "plan_comptable_update" ON plan_comptable FOR UPDATE USING (
  est_systeme = false AND organisation_id IN (SELECT public.get_user_org_ids())
);
CREATE POLICY "plan_comptable_delete" ON plan_comptable FOR DELETE USING (
  est_systeme = false AND organisation_id IN (SELECT public.get_user_org_ids())
);

-- 6. Also fix Phase 2 tables that may have the same issue
-- (factures, depenses, clients, produits, devis, avoirs, etc.)
DO $$
DECLARE
  phase2_tables TEXT[] := ARRAY[
    'factures','depenses','clients','produits','devis','avoirs',
    'lignes_facture','lignes_devis','rappels','factures_recurrentes',
    'cles_api','tickets','invitations_organisation'
  ];
  t TEXT;
  has_org_col BOOLEAN;
BEGIN
  FOREACH t IN ARRAY phase2_tables LOOP
    -- Check if table exists and has organisation_id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'organisation_id'
    ) INTO has_org_col;

    IF has_org_col THEN
      -- Drop and recreate any policies that reference utilisateurs_organisations directly
      EXECUTE format('DROP POLICY IF EXISTS "%s_org_select" ON %I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_org_insert" ON %I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_org_update" ON %I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_org_delete" ON %I', t, t);

      -- Only create if they don't already exist with different names
      -- This is safe because we're using unique policy names
      BEGIN
        EXECUTE format('CREATE POLICY "%s_org_select" ON %I FOR SELECT USING (
          organisation_id IN (SELECT public.get_user_org_ids())
        )', t, t);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- FIN Fix RLS
-- =====================================================
