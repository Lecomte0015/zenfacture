-- Activer RLS sur la table organizations si ce n'est pas déjà fait
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir les organisations auxquelles ils appartiennent
CREATE POLICY "Les utilisateurs peuvent voir les organisations auxquelles ils appartiennent"
ON public.organizations
FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_users 
    WHERE user_id = auth.uid()
  )
);

-- Politique pour permettre aux utilisateurs de créer des organisations
CREATE POLICY "Les utilisateurs peuvent créer des organisations"
ON public.organizations
FOR INSERT
WITH CHECK (true);

-- Politique pour permettre aux administrateurs de gérer toutes les organisations
CREATE POLICY "Les administrateurs peuvent gérer toutes les organisations"
ON public.organizations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
