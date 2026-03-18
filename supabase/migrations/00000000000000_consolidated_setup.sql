-- ============================================================
-- ZENFACTURE - Migration consolidée pour nouveau projet Supabase
-- ============================================================
-- Ce fichier remplace TOUTES les migrations précédentes.
-- À exécuter dans l'éditeur SQL de Supabase (Dashboard > SQL Editor)
-- ============================================================

-- 1. Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABLE: profils (profils utilisateurs)
-- Utilisée par: AuthContext, supportService, organisationService
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profils (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    plan_abonnement TEXT NOT NULL DEFAULT 'essentiel',
    trial_start_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
    ON public.profils FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
    ON public.profils FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
    ON public.profils FOR UPDATE
    USING (auth.uid() = id);

-- Trigger pour créer un profil automatiquement lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profils (id, name, email, trial_start_date, trial_end_date)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        NOW(),
        NOW() + INTERVAL '15 days'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. TABLE: invoices (factures)
-- Utilisée par: invoiceService, useInvoices
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT,
    client_name TEXT NOT NULL,
    client_company TEXT,
    client_address TEXT,
    client_city TEXT,
    client_postal_code TEXT,
    client_country TEXT,
    client_email TEXT,
    client_phone TEXT,
    client_vat TEXT,
    company_name TEXT NOT NULL,
    company_address TEXT NOT NULL,
    company_city TEXT NOT NULL,
    company_postal_code TEXT NOT NULL,
    company_country TEXT NOT NULL,
    company_vat TEXT,
    company_email TEXT,
    company_phone TEXT,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
    ON public.invoices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
    ON public.invoices FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);

-- ============================================================
-- 4. TABLE: organisations (organisations - noms français)
-- Utilisée par: organisationService, supportService, apiKeyService
-- ============================================================
DO $$ BEGIN
    CREATE TYPE role_utilisateur AS ENUM ('admin', 'membre', 'lecteur');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    proprietaire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. TABLE: utilisateurs_organisations (liaison utilisateurs-organisations)
-- Utilisée par: organisationService, supportService
-- ============================================================
CREATE TABLE IF NOT EXISTS public.utilisateurs_organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role role_utilisateur NOT NULL DEFAULT 'membre',
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organisation_id, utilisateur_id)
);

ALTER TABLE public.utilisateurs_organisations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_utilisateurs_organisations_utilisateur_id ON public.utilisateurs_organisations(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_organisations_org_id ON public.utilisateurs_organisations(organisation_id);

-- Politiques RLS pour organisations
CREATE POLICY "Les utilisateurs peuvent voir leurs organisations"
    ON public.organisations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.utilisateurs_organisations
        WHERE utilisateurs_organisations.organisation_id = organisations.id
        AND utilisateurs_organisations.utilisateur_id = auth.uid()
    ));

CREATE POLICY "Les utilisateurs peuvent créer des organisations"
    ON public.organisations FOR INSERT
    WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY "Les propriétaires peuvent modifier leurs organisations"
    ON public.organisations FOR UPDATE
    USING (auth.uid() = proprietaire_id);

-- Politiques RLS pour utilisateurs_organisations
CREATE POLICY "Les utilisateurs peuvent voir leurs appartenances"
    ON public.utilisateurs_organisations FOR SELECT
    USING (utilisateur_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.utilisateurs_organisations uo
            WHERE uo.organisation_id = utilisateurs_organisations.organisation_id
            AND uo.utilisateur_id = auth.uid()
            AND uo.role = 'admin'
        ));

CREATE POLICY "Les admins peuvent ajouter des membres"
    ON public.utilisateurs_organisations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.utilisateurs_organisations
            WHERE organisation_id = utilisateurs_organisations.organisation_id
            AND utilisateur_id = auth.uid()
            AND role = 'admin'
        )
        OR NOT EXISTS (
            SELECT 1 FROM public.utilisateurs_organisations
            WHERE organisation_id = utilisateurs_organisations.organisation_id
        )
    );

CREATE POLICY "Les admins peuvent modifier les membres"
    ON public.utilisateurs_organisations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.utilisateurs_organisations uo
            WHERE uo.organisation_id = utilisateurs_organisations.organisation_id
            AND uo.utilisateur_id = auth.uid()
            AND uo.role = 'admin'
        )
    );

CREATE POLICY "Les admins peuvent supprimer des membres"
    ON public.utilisateurs_organisations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.utilisateurs_organisations uo
            WHERE uo.organisation_id = utilisateurs_organisations.organisation_id
            AND uo.utilisateur_id = auth.uid()
            AND uo.role = 'admin'
        )
    );

-- ============================================================
-- 6. TABLE: organizations (noms anglais)
-- Utilisée par: teamService
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read organizations"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================
-- 7. TABLE: organization_members (membres - noms anglais)
-- Utilisée par: teamService
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Politique déplacée ici car elle dépend de organization_members
CREATE POLICY "Admins can manage organizations"
    ON public.organizations FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid()
            AND organization_id = organizations.id
            AND role = 'admin'
        )
    );

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organization members"
    ON public.organization_members FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "All operations on organization_members"
    ON public.organization_members FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 8. TABLE: organization_invitations (invitations)
-- Utilisée par: teamService
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'member',
    token TEXT DEFAULT gen_random_uuid()::TEXT,
    accepted BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view invitations"
    ON public.organization_invitations FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can create invitations"
    ON public.organization_invitations FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can update invitations"
    ON public.organization_invitations FOR UPDATE
    TO authenticated
    USING (true);

-- ============================================================
-- 9. TABLE: cles_api (clés API)
-- Utilisée par: apiKeyService
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cles_api (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    cle TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    derniere_utilisation TIMESTAMPTZ,
    cree_par UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.cles_api ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les admins peuvent gérer les clés API"
    ON public.cles_api FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.utilisateurs_organisations
            WHERE utilisateur_id = auth.uid()
            AND organisation_id = cles_api.organisation_id
            AND role = 'admin'
        )
    );

-- ============================================================
-- 10. TYPES et TABLE: tickets (support)
-- Utilisée par: supportService
-- ============================================================
DO $$ BEGIN
    CREATE TYPE statut_ticket AS ENUM ('ouvert', 'en_cours', 'resolu');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE priorite_ticket AS ENUM ('basse', 'normale', 'elevee', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    description TEXT NOT NULL,
    statut statut_ticket NOT NULL DEFAULT 'ouvert',
    priorite priorite_ticket NOT NULL DEFAULT 'normale',
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent gérer leurs propres tickets"
    ON public.tickets FOR ALL
    USING (utilisateur_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.utilisateurs_organisations
            WHERE utilisateur_id = auth.uid()
            AND organisation_id = tickets.organisation_id
            AND role = 'admin'
        ));

CREATE INDEX IF NOT EXISTS idx_tickets_utilisateur_id ON public.tickets(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON public.tickets(organisation_id);

-- ============================================================
-- 11. TABLE: commentaires_tickets
-- Utilisée par: supportService.ajouterCommentaire
-- ============================================================
CREATE TABLE IF NOT EXISTS public.commentaires_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    contenu TEXT NOT NULL,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.commentaires_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les commentaires de leurs tickets"
    ON public.commentaires_tickets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = commentaires_tickets.ticket_id
            AND (t.utilisateur_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.utilisateurs_organisations
                    WHERE utilisateur_id = auth.uid()
                    AND organisation_id = t.organisation_id
                    AND role = 'admin'
                ))
        )
    );

CREATE POLICY "Les utilisateurs peuvent créer des commentaires"
    ON public.commentaires_tickets FOR INSERT
    WITH CHECK (auth.uid() = utilisateur_id);

-- ============================================================
-- 12. TABLE: expenses (dépenses)
-- Utilisée par: ExpensesSection, ExpensesPage
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses"
    ON public.expenses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
    ON public.expenses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
    ON public.expenses FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON public.expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);

-- ============================================================
-- 13. FONCTIONS utilitaires
-- ============================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profils_updated_at
    BEFORE UPDATE ON public.profils
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer une clé API sécurisée
CREATE OR REPLACE FUNCTION generer_cle_api()
RETURNS TEXT AS $$
DECLARE
    cle TEXT;
BEGIN
    SELECT encode(gen_random_bytes(32), 'hex') INTO cle;
    RETURN 'zen_' || cle;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une organisation (français) avec l'utilisateur comme propriétaire
CREATE OR REPLACE FUNCTION creer_organisation(nom_organisation TEXT)
RETURNS UUID AS $$
DECLARE
    nouvelle_org_id UUID;
BEGIN
    INSERT INTO public.organisations (nom, proprietaire_id)
    VALUES (nom_organisation, auth.uid())
    RETURNING id INTO nouvelle_org_id;

    INSERT INTO public.utilisateurs_organisations (organisation_id, utilisateur_id, role)
    VALUES (nouvelle_org_id, auth.uid(), 'admin');

    RETURN nouvelle_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une organisation (anglais) et lier l'utilisateur
CREATE OR REPLACE FUNCTION public.create_organization_for_user(
    p_user_id UUID,
    p_org_name TEXT DEFAULT 'Mon entreprise',
    p_user_role TEXT DEFAULT 'admin'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
    v_org_id UUID;
BEGIN
    INSERT INTO public.organizations (name)
    VALUES (p_org_name)
    RETURNING id INTO v_org_id;

    INSERT INTO public.organization_members (user_id, organization_id, role)
    VALUES (p_user_id, v_org_id, p_user_role);

    RETURN v_org_id;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de la création de l''organisation: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_organization_for_user TO authenticated;

-- Fonction pour s'assurer qu'un utilisateur a une organisation
CREATE OR REPLACE FUNCTION public.ensure_user_has_organization(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
    org_id UUID;
    org_name TEXT;
BEGIN
    SELECT organization_id INTO org_id
    FROM organization_members
    WHERE organization_members.user_id = $1
    LIMIT 1;

    IF org_id IS NULL THEN
        SELECT 'Organisation-' || substr($1::text, 1, 8) INTO org_name;

        INSERT INTO organizations (name, created_at)
        VALUES (org_name, now())
        RETURNING id INTO org_id;

        INSERT INTO organization_members (user_id, organization_id, role, created_at)
        VALUES ($1, org_id, 'admin', now());
    END IF;

    RETURN org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_has_organization TO authenticated;

-- Fonction pour vérifier si l'utilisateur est en période d'essai
CREATE OR REPLACE FUNCTION public.is_user_on_trial(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    trial_end TIMESTAMPTZ;
BEGIN
    SELECT trial_end_date INTO trial_end
    FROM public.profils
    WHERE id = p_user_id;

    RETURN trial_end IS NOT NULL AND NOW() <= trial_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les jours restants d'essai
CREATE OR REPLACE FUNCTION public.get_remaining_trial_days(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    trial_end TIMESTAMPTZ;
    days_left INTEGER;
BEGIN
    SELECT trial_end_date INTO trial_end
    FROM public.profils
    WHERE id = p_user_id;

    IF trial_end IS NULL THEN
        RETURN 0;
    END IF;

    days_left := DATE_PART('day', trial_end - NOW());
    RETURN GREATEST(0, days_left);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour accéder aux organisations d'un utilisateur
CREATE OR REPLACE VIEW public.user_organizations AS
SELECT om.user_id, o.id AS organization_id, o.name AS organization_name, om.role
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id;

GRANT SELECT ON public.user_organizations TO authenticated;

-- ============================================================
-- FIN DE LA MIGRATION CONSOLIDÉE
-- ============================================================
