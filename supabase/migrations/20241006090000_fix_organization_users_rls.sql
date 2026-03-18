-- Activer RLS sur la table organization_users si ce n'est pas déjà fait
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres enregistrements
CREATE POLICY "Les utilisateurs peuvent voir leurs propres enregistrements organization_users"
ON public.organization_users
FOR SELECT
USING (auth.uid() = user_id);

-- Politique pour permettre aux administrateurs de voir tous les enregistrements
CREATE POLICY "Les administrateurs peuvent voir tous les enregistrements organization_users"
ON public.organization_users
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.organization_users
  WHERE user_id = auth.uid() AND role = 'admin'
));
