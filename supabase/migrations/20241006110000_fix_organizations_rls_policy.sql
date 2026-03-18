-- D'abord, supprimer les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les organisations auxquelles ils appartiennent" ON public.organizations;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des organisations" ON public.organizations;
DROP POLICY IF EXISTS "Les administrateurs peuvent gérer toutes les organisations" ON public.organizations;

-- Politique simplifiée pour permettre la création d'organisations
CREATE POLICY "Permettre la création d'organisations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique pour permettre la lecture des organisations
CREATE POLICY "Permettre la lecture des organisations"
ON public.organizations
FOR SELECT
TO authenticated
USING (true);

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
