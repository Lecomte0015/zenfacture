-- Corrige un bug où trial_start_date/trial_end_date restaient NULL pour les
-- inscriptions nécessitant une confirmation par email.
--
-- Contexte : src/context/AuthContext.tsx (register()) calcule et écrit les
-- dates d'essai via un upsert sur `profils`, mais UNIQUEMENT si Supabase Auth
-- renvoie une session immédiate (data.session truthy). Si la confirmation par
-- email est activée dans le Dashboard Supabase, aucune session n'est
-- retournée à l'inscription : le trigger handle_new_user() crée déjà la ligne
-- `profils` (sans dates d'essai) avant que le code client ne puisse
-- intervenir, et createUserFromSupabase() ne fait le backfill que si la ligne
-- `profils` n'existe pas encore — ce qui n'arrive jamais puisque le trigger
-- l'a déjà créée. Résultat : trial_start_date/trial_end_date restent NULL à
-- vie pour ces utilisateurs, isOnTrial (useTrial.ts) est toujours faux, et
-- le bandeau d'essai / l'accès complet pendant l'essai ne fonctionnent jamais.
--
-- Fix : le trigger handle_new_user(), qui s'exécute de façon fiable pour
-- TOUS les nouveaux comptes (avec ou sans confirmation email), fixe
-- directement trial_start_date = now() et trial_end_date = now() + 15 jours
-- à la création du profil. Durée alignée sur AuthContext.tsx (register()).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Créer le profil utilisateur (avec période d'essai de 15 jours)
    INSERT INTO public.profils (id, email, name, trial_start_date, trial_end_date, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NOW(),
        NOW() + INTERVAL '15 days',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Créer une organisation par défaut
    INSERT INTO public.organisations (nom, proprietaire_id, created_at, updated_at)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'name', 'Mon entreprise') || ' Organisation',
        NEW.id,
        NOW(),
        NOW()
    )
    RETURNING id INTO org_id;

    -- Lier l'utilisateur à l'organisation
    INSERT INTO public.utilisateurs_organisations (organisation_id, utilisateur_id, role, cree_le)
    VALUES (org_id, NEW.id, 'admin', NOW())
    ON CONFLICT (organisation_id, utilisateur_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Trigger automatique: crée le profil (avec essai 15 jours), l''organisation et le lien admin lors de l''inscription';
