-- Fonction pour lier un utilisateur à une organisation
CREATE OR REPLACE FUNCTION public.link_user_to_organization(
  p_user_id uuid,
  p_organization_id uuid,
  p_role text DEFAULT 'member'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    -- Si l'utilisateur n'existe pas, le créer dans auth.users
    -- Note: Cette partie nécessite des privilèges élevés et peut ne pas être possible selon votre configuration
    -- C'est une solution temporaire, à remplacer par une meilleure gestion des utilisateurs
    INSERT INTO auth.users (
      id, instance_id, aud, email, encrypted_password,
      email_confirmed_at, invited_at, confirmation_token,
      confirmation_sent_at, recovery_token, recovery_sent_at,
      email_change_token_new, email_change, email_change_sent_at,
      last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, phone
    ) VALUES (
      p_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'temp_' || p_user_id || '@example.com', '',
      now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL,
      '{}'::jsonb, jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      false, now(), now(), NULL
    );
  END IF;
  
  -- Créer l'association utilisateur-organisation
  INSERT INTO organization_users (
    user_id,
    organization_id,
    role,
    created_at
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_role,
    now()
  )
  ON CONFLICT (user_id, organization_id) 
  DO UPDATE SET role = EXCLUDED.role;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erreur lors de la liaison utilisateur-organisation: %', SQLERRM;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.link_user_to_organization TO authenticated;
