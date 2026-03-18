-- Créer une fonction pour créer une organisation et lier l'utilisateur
CREATE OR REPLACE FUNCTION public.create_organization_for_user(
  p_user_id uuid,
  p_org_name text DEFAULT 'Mon entreprise',
  p_user_role text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Créer l'organisation
  INSERT INTO public.organizations (name)
  VALUES (p_org_name)
  RETURNING id INTO v_org_id;
  
  -- Lier l'utilisateur à l'organisation
  INSERT INTO public.organization_users (user_id, organization_id, role)
  VALUES (p_user_id, v_org_id, p_user_role);
  
  -- Retourner l'ID de l'organisation créée
  RETURN v_org_id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erreur lors de la création de l\'organisation: %', SQLERRM;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.create_organization_for_user TO authenticated;
