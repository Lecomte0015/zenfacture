-- Fonction pour créer une organisation et lier l'utilisateur
CREATE OR REPLACE FUNCTION public.create_organization_for_user(
  user_id uuid,
  org_name text,
  user_role text DEFAULT 'admin'
) 
RETURNS TABLE (organization_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Créer une nouvelle organisation
  INSERT INTO organizations (name)
  VALUES (org_name)
  RETURNING id INTO new_org_id;
  
  -- Lier l'utilisateur à l'organisation
  INSERT INTO organization_users (user_id, organization_id, role)
  VALUES (user_id, new_org_id, user_role);
  
  -- Retourner l'ID de la nouvelle organisation
  RETURN QUERY SELECT new_org_id;
  
  -- S'assurer que l'utilisateur a les droits nécessaires
  EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA public TO %I', current_user);
  
  RETURN;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.create_organization_for_user TO authenticated;
