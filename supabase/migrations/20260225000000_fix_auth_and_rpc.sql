-- Migration pour corriger les fonctions RPC et l'authentification
-- Date: 2026-02-25

-- 1. Corriger la fonction creer_organisation pour utiliser auth.users au lieu de auth.utilisateurs
DROP FUNCTION IF EXISTS public.creer_organisation(TEXT);

CREATE OR REPLACE FUNCTION public.creer_organisation(nom_organisation TEXT)
RETURNS UUID AS $$
DECLARE
    nouvelle_org_id UUID;
    user_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur connecté
    user_id := auth.uid();

    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié';
    END IF;

    -- Créer l'organisation
    INSERT INTO public.organisations (nom, proprietaire_id, created_at, updated_at)
    VALUES (nom_organisation, user_id, NOW(), NOW())
    RETURNING id INTO nouvelle_org_id;

    -- Lier l'utilisateur à l'organisation comme admin
    INSERT INTO public.utilisateurs_organisations (organisation_id, utilisateur_id, role, cree_le)
    VALUES (nouvelle_org_id, user_id, 'admin', NOW())
    ON CONFLICT (organisation_id, utilisateur_id) DO NOTHING;

    RETURN nouvelle_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corriger la fonction get_my_organisation_id
DROP FUNCTION IF EXISTS public.get_my_organisation_id();

CREATE OR REPLACE FUNCTION public.get_my_organisation_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
    user_id UUID;
BEGIN
    user_id := auth.uid();

    IF user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Essayer de récupérer l'organisation de l'utilisateur
    SELECT organisation_id INTO org_id
    FROM public.utilisateurs_organisations
    WHERE utilisateur_id = user_id
    LIMIT 1;

    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. S'assurer que les colonnes nécessaires existent dans la table organisations
DO $$
BEGIN
    -- Ajouter created_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organisations'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.organisations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Ajouter updated_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organisations'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.organisations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 4. Vérifier que RLS est activé sur les tables importantes
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateurs_organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;

-- 5. Politique RLS simplifiée pour organisations (lecture pour tous les membres)
DROP POLICY IF EXISTS "Les membres peuvent voir leur organisation" ON public.organisations;
CREATE POLICY "Les membres peuvent voir leur organisation"
ON public.organisations FOR SELECT
USING (
    id IN (
        SELECT organisation_id
        FROM public.utilisateurs_organisations
        WHERE utilisateur_id = auth.uid()
    )
);

-- 6. Politique RLS pour permettre aux propriétaires de modifier leur organisation
DROP POLICY IF EXISTS "Les propriétaires peuvent modifier leur organisation" ON public.organisations;
CREATE POLICY "Les propriétaires peuvent modifier leur organisation"
ON public.organisations FOR UPDATE
USING (proprietaire_id = auth.uid());

-- 7. Politique RLS pour utilisateurs_organisations (lecture)
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs liens d'organisation" ON public.utilisateurs_organisations;
CREATE POLICY "Les utilisateurs peuvent voir leurs liens d'organisation"
ON public.utilisateurs_organisations FOR SELECT
USING (utilisateur_id = auth.uid());

-- 8. Politique RLS pour profils (lecture et mise à jour du propre profil)
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur profil" ON public.profils;
CREATE POLICY "Les utilisateurs peuvent voir leur profil"
ON public.profils FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur profil" ON public.profils;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur profil"
ON public.profils FOR UPDATE
USING (id = auth.uid());

DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur profil" ON public.profils;
CREATE POLICY "Les utilisateurs peuvent créer leur profil"
ON public.profils FOR INSERT
WITH CHECK (id = auth.uid());

-- 9. Fonction helper pour créer automatiquement le profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Créer le profil utilisateur
    INSERT INTO public.profils (id, email, name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
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

-- 10. Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 11. Commentaire
COMMENT ON FUNCTION public.creer_organisation IS 'Crée une nouvelle organisation et lie l''utilisateur comme admin';
COMMENT ON FUNCTION public.get_my_organisation_id IS 'Retourne l''ID de l''organisation de l''utilisateur connecté';
COMMENT ON FUNCTION public.handle_new_user IS 'Trigger automatique: crée le profil et l''organisation lors de l''inscription';
