-- Créer une fonction pour gérer la création d'organisation
CREATE OR REPLACE FUNCTION public.ensure_user_has_organization(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
  org_name text;
BEGIN
  -- Vérifier si l'utilisateur a déjà une organisation
  SELECT organization_id INTO org_id
  FROM organization_users
  WHERE organization_users.user_id = $1
  LIMIT 1;
  
  -- Si l'utilisateur n'a pas d'organisation, en créer une
  IF org_id IS NULL THEN
    -- Générer un nom d'organisation basé sur l'ID utilisateur
    SELECT 'Organisation-' || substr($1::text, 1, 8) INTO org_name;
    
    -- Créer la nouvelle organisation
    INSERT INTO organizations (name, created_at)
    VALUES (org_name, now())
    RETURNING id INTO org_id;
    
    -- Lier l'utilisateur à l'organisation
    INSERT INTO organization_users (user_id, organization_id, role, created_at)
    VALUES ($1, org_id, 'admin', now());
  END IF;
  
  RETURN org_id;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.ensure_user_has_organization TO authenticated;

-- Créer une vue pour faciliter l'accès à l'organisation de l'utilisateur
CREATE OR REPLACE VIEW public.user_organizations AS
SELECT ou.user_id, o.id as organization_id, o.name as organization_name, ou.role
FROM organization_users ou
JOIN organizations o ON o.id = ou.organization_id;

-- Donner les permissions sur la vue
GRANT SELECT ON public.user_organizations TO authenticated;
