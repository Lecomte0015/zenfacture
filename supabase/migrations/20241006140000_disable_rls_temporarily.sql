-- Désactiver temporairement RLS pour la table organizations
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Désactiver temporairement RLS pour la table organization_users
ALTER TABLE public.organization_users DISABLE ROW LEVEL SECURITY;

-- Créer une politique très permissive pour les organisations
CREATE POLICY "Allow all operations on organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Créer une politique très permissive pour les associations utilisateur-organisation
CREATE POLICY "Allow all operations on organization_users"
ON public.organization_users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
