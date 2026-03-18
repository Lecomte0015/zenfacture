-- Désactiver temporairement les contraintes de clé étrangère
ALTER TABLE organization_users 
DROP CONSTRAINT IF EXISTS organization_users_user_id_fkey;

-- Recréer la contrainte avec ON DELETE CASCADE
ALTER TABLE organization_users
ADD CONSTRAINT organization_users_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Activer RLS sur la table users si ce n'est pas déjà fait
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre aux utilisateurs de se voir eux-mêmes
CREATE POLICY "Users can view their own data"
ON auth.users
FOR SELECT
USING (auth.uid() = id);

-- Créer une vue pour accéder aux utilisateurs de manière sécurisée
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  created_at,
  updated_at
FROM auth.users;

-- Donner les permissions sur la vue
GRANT SELECT ON public.profiles TO authenticated;
