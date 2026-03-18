-- ============================================================
-- ZENFACTURE - SCRIPT COMPLET À EXÉCUTER DANS SUPABASE SQL EDITOR
-- ============================================================
-- Ce script combine TOUTES les migrations dans le bon ordre.
-- Il est idempotent : peut être exécuté plusieurs fois sans erreur.
-- ============================================================

-- ============================================================
-- PARTIE 1 : EXTENSIONS + FONCTIONS UTILITAIRES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PARTIE 2 : TABLE profils
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

-- Trigger auto-création profil
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
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PARTIE 3 : TABLE organisations + utilisateurs_organisations
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

-- Colonnes additionnelles pour organisations
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS ville TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS pays TEXT DEFAULT 'CH';
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS numero_tva TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS telephone TEXT;

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.utilisateurs_organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role role_utilisateur NOT NULL DEFAULT 'membre',
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organisation_id, utilisateur_id)
);

ALTER TABLE public.utilisateurs_organisations ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';
ALTER TABLE public.utilisateurs_organisations ADD COLUMN IF NOT EXISTS mis_a_jour_le TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.utilisateurs_organisations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_utilisateurs_organisations_utilisateur_id ON public.utilisateurs_organisations(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_organisations_org_id ON public.utilisateurs_organisations(organisation_id);

-- ============================================================
-- PARTIE 4 : TABLE invoices → factures (renommage si nécessaire)
-- ============================================================
-- Créer invoices si rien n'existe
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    invoice_number TEXT,
    client_name TEXT,
    client_company TEXT,
    client_address TEXT,
    client_city TEXT,
    client_postal_code TEXT,
    client_country TEXT,
    client_email TEXT,
    client_phone TEXT,
    client_vat TEXT,
    company_name TEXT,
    company_address TEXT,
    company_city TEXT,
    company_postal_code TEXT,
    company_country TEXT,
    company_vat TEXT,
    company_email TEXT,
    company_phone TEXT,
    date DATE,
    due_date DATE,
    issue_date DATE,
    status TEXT DEFAULT 'draft',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) DEFAULT 0,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renommer invoices → factures
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'factures') THEN
    ALTER TABLE public.invoices RENAME TO factures;
    RAISE NOTICE 'Table invoices renommée en factures';
  END IF;
END $$;

-- Si factures n'existe toujours pas (cas où invoices n'existait pas non plus)
CREATE TABLE IF NOT EXISTS public.factures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    invoice_number TEXT,
    client_name TEXT,
    client_company TEXT,
    client_address TEXT,
    client_city TEXT,
    client_postal_code TEXT,
    client_country TEXT,
    client_email TEXT,
    client_phone TEXT,
    client_vat TEXT,
    company_name TEXT,
    company_address TEXT,
    company_city TEXT,
    company_postal_code TEXT,
    company_country TEXT,
    company_vat TEXT,
    company_email TEXT,
    company_phone TEXT,
    date DATE,
    due_date DATE,
    issue_date DATE,
    status TEXT DEFAULT 'draft',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) DEFAULT 0,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter organisation_id à factures si manquant
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS devise TEXT DEFAULT 'CHF';

ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTIE 5 : TABLE expenses → depenses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    description TEXT,
    amount NUMERIC(10, 2) DEFAULT 0,
    category TEXT,
    date DATE,
    status TEXT DEFAULT 'pending',
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renommer expenses → depenses
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'depenses') THEN
    ALTER TABLE public.expenses RENAME TO depenses;
    RAISE NOTICE 'Table expenses renommée en depenses';
  END IF;
END $$;

-- Créer depenses si n'existe toujours pas
CREATE TABLE IF NOT EXISTS public.depenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    description TEXT,
    amount NUMERIC(10, 2) DEFAULT 0,
    currency TEXT DEFAULT 'CHF',
    category TEXT,
    date DATE,
    vat_rate NUMERIC(4,2),
    status TEXT DEFAULT 'pending',
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CHF';
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(4,2);

ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTIE 6 : TABLE clients
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT,
    entreprise TEXT,
    email TEXT,
    telephone TEXT,
    adresse TEXT,
    code_postal TEXT,
    ville TEXT,
    pays TEXT DEFAULT 'CH',
    numero_tva TEXT,
    notes TEXT,
    numero_client TEXT,
    devise_preferee TEXT DEFAULT 'CHF',
    conditions_paiement INTEGER DEFAULT 30,
    cree_le TIMESTAMPTZ DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_clients_organisation_id ON public.clients(organisation_id);

-- ============================================================
-- PARTIE 7 : TABLE rappels
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rappels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facture_id UUID,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    type_rappel TEXT DEFAULT 'manuel',
    niveau INTEGER DEFAULT 1,
    date_envoi TIMESTAMPTZ,
    contenu TEXT,
    statut TEXT NOT NULL DEFAULT 'a_faire',
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rappels ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTIE 8 : Tables support (tickets)
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

CREATE TABLE IF NOT EXISTS public.commentaires_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    contenu TEXT NOT NULL,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.commentaires_tickets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTIE 9 : TABLE cles_api
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

-- ============================================================
-- PARTIE 10 : Tables Phase 2
-- ============================================================

-- Produits
CREATE TABLE IF NOT EXISTS public.produits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    prix_unitaire NUMERIC(10,2) NOT NULL DEFAULT 0,
    taux_tva NUMERIC(4,2) NOT NULL DEFAULT 8.1,
    unite TEXT DEFAULT 'piece',
    categorie TEXT,
    actif BOOLEAN DEFAULT true,
    cree_le TIMESTAMPTZ DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

-- Templates facture
CREATE TABLE IF NOT EXISTS public.templates_facture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    est_defaut BOOLEAN DEFAULT false,
    est_systeme BOOLEAN DEFAULT false,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.templates_facture ENABLE ROW LEVEL SECURITY;

-- Devis
CREATE TABLE IF NOT EXISTS public.devis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id),
    numero_devis TEXT NOT NULL,
    date_devis DATE NOT NULL DEFAULT CURRENT_DATE,
    date_validite DATE,
    statut TEXT NOT NULL DEFAULT 'brouillon'
      CHECK (statut IN ('brouillon','envoye','accepte','refuse','expire','converti')),
    articles JSONB NOT NULL DEFAULT '[]',
    sous_total NUMERIC(10,2) DEFAULT 0,
    total_tva NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    devise TEXT DEFAULT 'CHF',
    notes TEXT,
    conditions TEXT,
    facture_id UUID,
    cree_le TIMESTAMPTZ DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;

-- Avoirs
CREATE TABLE IF NOT EXISTS public.avoirs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id),
    facture_id UUID,
    numero_avoir TEXT NOT NULL,
    date_avoir DATE NOT NULL DEFAULT CURRENT_DATE,
    statut TEXT NOT NULL DEFAULT 'brouillon'
      CHECK (statut IN ('brouillon','emis','applique','annule')),
    articles JSONB NOT NULL DEFAULT '[]',
    sous_total NUMERIC(10,2) DEFAULT 0,
    total_tva NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    devise TEXT DEFAULT 'CHF',
    motif TEXT,
    notes TEXT,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.avoirs ENABLE ROW LEVEL SECURITY;

-- Factures récurrentes
CREATE TABLE IF NOT EXISTS public.factures_recurrentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id),
    nom TEXT NOT NULL,
    articles JSONB NOT NULL DEFAULT '[]',
    sous_total NUMERIC(10,2) DEFAULT 0,
    total_tva NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    devise TEXT DEFAULT 'CHF',
    frequence TEXT NOT NULL DEFAULT 'mensuel'
      CHECK (frequence IN ('hebdomadaire','mensuel','trimestriel','semestriel','annuel')),
    jour_emission INTEGER DEFAULT 1,
    prochaine_emission DATE,
    derniere_emission DATE,
    date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin DATE,
    actif BOOLEAN DEFAULT true,
    notes TEXT,
    cree_le TIMESTAMPTZ DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.factures_recurrentes ENABLE ROW LEVEL SECURITY;

-- Enrichir factures avec colonnes Phase 2
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factures' AND column_name = 'client_id') THEN
    ALTER TABLE public.factures ADD COLUMN client_id UUID REFERENCES public.clients(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factures' AND column_name = 'template_id') THEN
    ALTER TABLE public.factures ADD COLUMN template_id UUID REFERENCES public.templates_facture(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factures' AND column_name = 'facture_recurrente_id') THEN
    ALTER TABLE public.factures ADD COLUMN facture_recurrente_id UUID REFERENCES public.factures_recurrentes(id);
  END IF;
END $$;

-- Templates système (seed)
INSERT INTO public.templates_facture (nom, description, est_systeme, config)
SELECT 'Classique', 'Design épuré et professionnel', true,
  '{"couleur_primaire":"#1a56db","couleur_secondaire":"#6b7280","police":"Helvetica","mise_en_page":"standard"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates_facture WHERE nom = 'Classique' AND est_systeme = true);

INSERT INTO public.templates_facture (nom, description, est_systeme, config)
SELECT 'Moderne', 'Design contemporain avec accents de couleur', true,
  '{"couleur_primaire":"#059669","couleur_secondaire":"#374151","police":"Arial","mise_en_page":"moderne"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates_facture WHERE nom = 'Moderne' AND est_systeme = true);

INSERT INTO public.templates_facture (nom, description, est_systeme, config)
SELECT 'Minimaliste', 'Design sobre et minimaliste', true,
  '{"couleur_primaire":"#111827","couleur_secondaire":"#9ca3af","police":"Helvetica","mise_en_page":"minimal"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.templates_facture WHERE nom = 'Minimaliste' AND est_systeme = true);

-- ============================================================
-- PARTIE 11 : Tables Phase 3
-- ============================================================

-- OCR
CREATE TABLE IF NOT EXISTS public.ocr_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    resultat_json JSONB,
    statut TEXT NOT NULL DEFAULT 'en_attente'
      CHECK (statut IN ('en_attente','en_cours','termine','erreur')),
    depense_id UUID REFERENCES public.depenses(id),
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ocr_scans ENABLE ROW LEVEL SECURITY;

-- E-banking
CREATE TABLE IF NOT EXISTS public.comptes_bancaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    iban TEXT NOT NULL,
    bic TEXT,
    devise TEXT DEFAULT 'CHF',
    solde NUMERIC(12,2) DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comptes_bancaires ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.transactions_bancaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compte_id UUID NOT NULL REFERENCES public.comptes_bancaires(id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    reference TEXT,
    montant NUMERIC(12,2) NOT NULL,
    devise TEXT DEFAULT 'CHF',
    date_valeur DATE NOT NULL,
    date_comptable DATE,
    description TEXT,
    type TEXT DEFAULT 'credit' CHECK (type IN ('credit','debit')),
    statut_rapprochement TEXT DEFAULT 'non_rapproche'
      CHECK (statut_rapprochement IN ('non_rapproche','rapproche','ignore')),
    facture_id UUID REFERENCES public.factures(id),
    depense_id UUID REFERENCES public.depenses(id),
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions_bancaires ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.fichiers_bancaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    nom_fichier TEXT NOT NULL,
    type_fichier TEXT NOT NULL CHECK (type_fichier IN ('camt053','camt054','pain001')),
    statut TEXT DEFAULT 'importe' CHECK (statut IN ('importe','traite','erreur')),
    nb_transactions INTEGER DEFAULT 0,
    date_import TIMESTAMPTZ DEFAULT NOW(),
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fichiers_bancaires ENABLE ROW LEVEL SECURITY;

-- Comptabilité
CREATE TABLE IF NOT EXISTS public.plan_comptable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    numero TEXT NOT NULL,
    nom TEXT NOT NULL,
    type_compte TEXT NOT NULL CHECK (type_compte IN ('actif','passif','charge','produit')),
    categorie TEXT,
    parent_id UUID REFERENCES public.plan_comptable(id),
    actif BOOLEAN DEFAULT true,
    est_systeme BOOLEAN DEFAULT false,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plan_comptable ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.exercices_comptables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut TEXT DEFAULT 'ouvert' CHECK (statut IN ('ouvert','cloture')),
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercices_comptables ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ecritures_comptables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    exercice_id UUID REFERENCES public.exercices_comptables(id),
    numero_piece TEXT,
    date_ecriture DATE NOT NULL,
    libelle TEXT NOT NULL,
    compte_debit_id UUID REFERENCES public.plan_comptable(id),
    compte_credit_id UUID REFERENCES public.plan_comptable(id),
    montant NUMERIC(12,2) NOT NULL,
    devise TEXT DEFAULT 'CHF',
    facture_id UUID REFERENCES public.factures(id),
    depense_id UUID REFERENCES public.depenses(id),
    transaction_id UUID REFERENCES public.transactions_bancaires(id),
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ecritures_comptables ENABLE ROW LEVEL SECURITY;

-- TVA
CREATE TABLE IF NOT EXISTS public.declarations_tva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    exercice_id UUID REFERENCES public.exercices_comptables(id),
    periode_debut DATE NOT NULL,
    periode_fin DATE NOT NULL,
    methode TEXT DEFAULT 'effective' CHECK (methode IN ('effective','forfaitaire')),
    chiffre_affaires NUMERIC(12,2) DEFAULT 0,
    tva_due NUMERIC(12,2) DEFAULT 0,
    tva_deductible NUMERIC(12,2) DEFAULT 0,
    tva_nette NUMERIC(12,2) DEFAULT 0,
    statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon','valide','soumis')),
    xml_data TEXT,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.declarations_tva ENABLE ROW LEVEL SECURITY;

-- eBill
CREATE TABLE IF NOT EXISTS public.ebill_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    participant_id TEXT,
    statut TEXT DEFAULT 'inactif' CHECK (statut IN ('inactif','en_cours','actif')),
    actif BOOLEAN DEFAULT false,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ebill_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ebill_envois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    facture_id UUID REFERENCES public.factures(id),
    participant_destinataire TEXT,
    statut TEXT DEFAULT 'en_attente'
      CHECK (statut IN ('en_attente','envoye','accepte','refuse','erreur')),
    date_envoi TIMESTAMPTZ,
    date_acceptation TIMESTAMPTZ,
    reference_ebill TEXT,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ebill_envois ENABLE ROW LEVEL SECURITY;

-- Portail fiduciaire
CREATE TABLE IF NOT EXISTS public.acces_fiduciaire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    email_fiduciaire TEXT NOT NULL,
    nom_fiduciaire TEXT,
    token_acces TEXT NOT NULL UNIQUE,
    permissions JSONB DEFAULT '["factures","depenses","comptabilite","tva"]',
    actif BOOLEAN DEFAULT true,
    derniere_connexion TIMESTAMPTZ,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.acces_fiduciaire ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.exports_fiduciaire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    acces_id UUID REFERENCES public.acces_fiduciaire(id),
    type_export TEXT NOT NULL CHECK (type_export IN ('plan_comptable','journal','bilan','tva')),
    periode_debut DATE,
    periode_fin DATE,
    fichier_url TEXT,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exports_fiduciaire ENABLE ROW LEVEL SECURITY;

-- Imports
CREATE TABLE IF NOT EXISTS public.imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('bexio','cresus','generique')),
    type_donnees TEXT NOT NULL CHECK (type_donnees IN ('clients','factures','produits','depenses')),
    statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours','termine','erreur')),
    nb_lignes INTEGER DEFAULT 0,
    nb_importees INTEGER DEFAULT 0,
    nb_erreurs INTEGER DEFAULT 0,
    erreurs_detail JSONB,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;

-- Invitations organisation
CREATE TABLE IF NOT EXISTS public.invitations_organisation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'membre',
    token TEXT DEFAULT gen_random_uuid()::TEXT,
    accepted BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invitations_organisation ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTIE 12 : Plan comptable PME suisse (seed)
-- ============================================================
INSERT INTO public.plan_comptable (numero, nom, type_compte, categorie, est_systeme)
SELECT * FROM (VALUES
  ('1000', 'Caisse', 'actif', 'Liquidités', true),
  ('1020', 'Banque', 'actif', 'Liquidités', true),
  ('1100', 'Débiteurs', 'actif', 'Créances', true),
  ('1170', 'TVA préalable (impôt préalable)', 'actif', 'Créances', true),
  ('1200', 'Stock de marchandises', 'actif', 'Stocks', true),
  ('1500', 'Machines et appareils', 'actif', 'Immobilisations', true),
  ('1510', 'Mobilier de bureau', 'actif', 'Immobilisations', true),
  ('1520', 'Matériel informatique', 'actif', 'Immobilisations', true),
  ('2000', 'Créanciers (fournisseurs)', 'passif', 'Dettes à court terme', true),
  ('2200', 'TVA due', 'passif', 'Dettes à court terme', true),
  ('2270', 'Charges sociales dues', 'passif', 'Dettes à court terme', true),
  ('2800', 'Capital propre', 'passif', 'Capital', true),
  ('2900', 'Réserves', 'passif', 'Capital', true),
  ('2990', 'Bénéfice / Perte reporté', 'passif', 'Capital', true),
  ('3000', 'Ventes de marchandises', 'produit', 'Chiffre d''affaires', true),
  ('3200', 'Ventes de prestations de services', 'produit', 'Chiffre d''affaires', true),
  ('3400', 'Autres produits d''exploitation', 'produit', 'Chiffre d''affaires', true),
  ('3800', 'Rabais et escomptes accordés', 'produit', 'Déductions', true),
  ('4000', 'Achats de marchandises', 'charge', 'Charges matières', true),
  ('4400', 'Sous-traitance', 'charge', 'Charges matières', true),
  ('5000', 'Salaires', 'charge', 'Charges de personnel', true),
  ('5700', 'Charges sociales', 'charge', 'Charges de personnel', true),
  ('5800', 'Autres charges de personnel', 'charge', 'Charges de personnel', true),
  ('6000', 'Loyer', 'charge', 'Charges d''exploitation', true),
  ('6100', 'Entretien et réparations', 'charge', 'Charges d''exploitation', true),
  ('6200', 'Assurances', 'charge', 'Charges d''exploitation', true),
  ('6300', 'Énergie', 'charge', 'Charges d''exploitation', true),
  ('6400', 'Frais de transport', 'charge', 'Charges d''exploitation', true),
  ('6500', 'Frais d''administration', 'charge', 'Charges d''exploitation', true),
  ('6510', 'Téléphone et internet', 'charge', 'Charges d''exploitation', true),
  ('6520', 'Frais postaux', 'charge', 'Charges d''exploitation', true),
  ('6530', 'Fournitures de bureau', 'charge', 'Charges d''exploitation', true),
  ('6570', 'Frais informatiques', 'charge', 'Charges d''exploitation', true),
  ('6600', 'Publicité', 'charge', 'Charges d''exploitation', true),
  ('6700', 'Autres charges d''exploitation', 'charge', 'Charges d''exploitation', true),
  ('6800', 'Amortissements', 'charge', 'Charges d''exploitation', true),
  ('6900', 'Charges financières', 'charge', 'Charges financières', true),
  ('8000', 'Produits hors exploitation', 'produit', 'Hors exploitation', true),
  ('8100', 'Charges hors exploitation', 'charge', 'Hors exploitation', true),
  ('8500', 'Produits exceptionnels', 'produit', 'Exceptionnel', true),
  ('8900', 'Impôts directs', 'charge', 'Impôts', true)
) AS v(numero, nom, type_compte, categorie, est_systeme)
WHERE NOT EXISTS (SELECT 1 FROM public.plan_comptable WHERE est_systeme = true LIMIT 1);

-- ============================================================
-- PARTIE 13 : Nettoyage tables anglaises redondantes
-- ============================================================
DROP VIEW IF EXISTS public.user_organizations;
DROP FUNCTION IF EXISTS public.create_organization_for_user(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.ensure_user_has_organization(UUID);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members') THEN
    DROP TABLE public.organization_members CASCADE;
    RAISE NOTICE 'Table organization_members supprimée';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    DROP TABLE public.organizations CASCADE;
    RAISE NOTICE 'Table organizations supprimée';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_invitations') THEN
    DROP TABLE public.organization_invitations CASCADE;
    RAISE NOTICE 'Table organization_invitations supprimée';
  END IF;
END $$;

-- Supprimer invoices si factures existe maintenant
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'factures') THEN
    DROP TABLE public.invoices CASCADE;
    RAISE NOTICE 'Table invoices supprimée (factures existe)';
  END IF;
END $$;

-- ============================================================
-- PARTIE 14 : FONCTIONS SECURITY DEFINER (RLS fix)
-- ============================================================

-- Fonction RPC pour récupérer l'organisation_id du user connecté
CREATE OR REPLACE FUNCTION public.get_my_organisation_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id
  FROM utilisateurs_organisations
  WHERE utilisateur_id = auth.uid()
  LIMIT 1;
$$;

-- Fonction pour récupérer toutes les organisations du user
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id
  FROM utilisateurs_organisations
  WHERE utilisateur_id = auth.uid();
$$;

-- Fonction pour vérifier si le user est admin d'une org
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM utilisateurs_organisations
    WHERE organisation_id = org_id
    AND utilisateur_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Fonction pour créer une organisation
CREATE OR REPLACE FUNCTION public.creer_organisation(nom_organisation TEXT)
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

-- Fonction pour générer une clé API
CREATE OR REPLACE FUNCTION generer_cle_api()
RETURNS TEXT AS $$
DECLARE
    cle TEXT;
BEGIN
    SELECT encode(gen_random_bytes(32), 'hex') INTO cle;
    RETURN 'zen_' || cle;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonctions trial
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

CREATE OR REPLACE FUNCTION public.get_remaining_trial_days(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    trial_end TIMESTAMPTZ;
    days_left INTEGER;
BEGIN
    SELECT trial_end_date INTO trial_end
    FROM public.profils
    WHERE id = p_user_id;
    IF trial_end IS NULL THEN RETURN 0; END IF;
    days_left := DATE_PART('day', trial_end - NOW());
    RETURN GREATEST(0, days_left);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PARTIE 15 : SUPPRIMER TOUTES LES POLICIES EXISTANTES
-- ============================================================

-- Supprimer toutes les policies de TOUTES les tables pour repartir proprement
DO $$
DECLARE
  pol RECORD;
  tbl TEXT;
  all_tables TEXT[] := ARRAY[
    'profils', 'organisations', 'utilisateurs_organisations',
    'factures', 'depenses', 'clients', 'rappels',
    'tickets', 'commentaires_tickets', 'cles_api',
    'produits', 'templates_facture', 'devis', 'avoirs', 'factures_recurrentes',
    'ocr_scans', 'comptes_bancaires', 'transactions_bancaires', 'fichiers_bancaires',
    'plan_comptable', 'exercices_comptables', 'ecritures_comptables',
    'declarations_tva', 'ebill_config', 'ebill_envois',
    'acces_fiduciaire', 'exports_fiduciaire', 'imports',
    'invitations_organisation'
  ];
BEGIN
  FOREACH tbl IN ARRAY all_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      FOR pol IN
        SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- PARTIE 16 : RECRÉER TOUTES LES POLICIES (avec SECURITY DEFINER)
-- ============================================================

-- Profils (basé sur auth.uid() = id)
CREATE POLICY "profils_select_own" ON public.profils
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "profils_insert_own" ON public.profils
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profils_update_own" ON public.profils
  FOR UPDATE USING (id = auth.uid());

-- Utilisateurs_organisations (basé sur utilisateur_id = auth.uid())
CREATE POLICY "uo_select_own" ON public.utilisateurs_organisations
  FOR SELECT USING (utilisateur_id = auth.uid());
CREATE POLICY "uo_insert_admin" ON public.utilisateurs_organisations
  FOR INSERT WITH CHECK (public.is_org_admin(organisation_id) OR NOT EXISTS (
    SELECT 1 FROM public.utilisateurs_organisations WHERE organisation_id = utilisateurs_organisations.organisation_id
  ));
CREATE POLICY "uo_update_admin" ON public.utilisateurs_organisations
  FOR UPDATE USING (public.is_org_admin(organisation_id));
CREATE POLICY "uo_delete_admin" ON public.utilisateurs_organisations
  FOR DELETE USING (public.is_org_admin(organisation_id));

-- Organisations
CREATE POLICY "org_select" ON public.organisations
  FOR SELECT USING (id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "org_insert" ON public.organisations
  FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);
CREATE POLICY "org_update_admin" ON public.organisations
  FOR UPDATE USING (public.is_org_admin(id));

-- Tables standard avec organisation_id (utilise get_user_org_ids)
DO $$
DECLARE
  tbl TEXT;
  standard_tables TEXT[] := ARRAY[
    'clients', 'produits', 'factures', 'depenses', 'devis', 'avoirs',
    'rappels', 'factures_recurrentes',
    'cles_api', 'tickets', 'invitations_organisation',
    'ocr_scans', 'comptes_bancaires', 'transactions_bancaires', 'fichiers_bancaires',
    'exercices_comptables', 'ecritures_comptables',
    'declarations_tva', 'ebill_config', 'ebill_envois',
    'acces_fiduciaire', 'exports_fiduciaire', 'imports'
  ];
  has_org_col BOOLEAN;
BEGIN
  FOREACH tbl IN ARRAY standard_tables LOOP
    -- Vérifier si la table existe et a une colonne organisation_id
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'organisation_id'
    ) INTO has_org_col;

    IF NOT has_org_col THEN
      CONTINUE;
    END IF;

    EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (
      organisation_id IN (SELECT public.get_user_org_ids())
    )', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT WITH CHECK (
      organisation_id IN (SELECT public.get_user_org_ids())
    )', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE USING (
      organisation_id IN (SELECT public.get_user_org_ids())
    )', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE USING (
      organisation_id IN (SELECT public.get_user_org_ids())
    )', tbl, tbl);
  END LOOP;
END $$;

-- Policies spéciales pour plan_comptable (comptes système visibles par tous)
CREATE POLICY "plan_comptable_select" ON public.plan_comptable FOR SELECT USING (
  est_systeme = true OR organisation_id IN (SELECT public.get_user_org_ids())
);
CREATE POLICY "plan_comptable_insert" ON public.plan_comptable FOR INSERT WITH CHECK (
  organisation_id IN (SELECT public.get_user_org_ids())
);
CREATE POLICY "plan_comptable_update" ON public.plan_comptable FOR UPDATE USING (
  est_systeme = false AND organisation_id IN (SELECT public.get_user_org_ids())
);
CREATE POLICY "plan_comptable_delete" ON public.plan_comptable FOR DELETE USING (
  est_systeme = false AND organisation_id IN (SELECT public.get_user_org_ids())
);

-- Policies spéciales pour templates_facture (templates système visibles par tous)
DO $$ BEGIN
  DROP POLICY IF EXISTS "templates_facture_select" ON public.templates_facture;
  DROP POLICY IF EXISTS "templates_facture_insert" ON public.templates_facture;
  DROP POLICY IF EXISTS "templates_facture_update" ON public.templates_facture;
  DROP POLICY IF EXISTS "templates_facture_delete" ON public.templates_facture;

  CREATE POLICY "templates_facture_select" ON public.templates_facture FOR SELECT USING (
    est_systeme = true OR organisation_id IN (SELECT public.get_user_org_ids())
  );
  CREATE POLICY "templates_facture_insert" ON public.templates_facture FOR INSERT WITH CHECK (
    organisation_id IN (SELECT public.get_user_org_ids())
  );
  CREATE POLICY "templates_facture_update" ON public.templates_facture FOR UPDATE USING (
    est_systeme = false AND organisation_id IN (SELECT public.get_user_org_ids())
  );
  CREATE POLICY "templates_facture_delete" ON public.templates_facture FOR DELETE USING (
    est_systeme = false AND organisation_id IN (SELECT public.get_user_org_ids())
  );
END $$;

-- Policies commentaires_tickets
CREATE POLICY "commentaires_tickets_select" ON public.commentaires_tickets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = commentaires_tickets.ticket_id
    AND t.organisation_id IN (SELECT public.get_user_org_ids())
  )
);
CREATE POLICY "commentaires_tickets_insert" ON public.commentaires_tickets FOR INSERT
  WITH CHECK (auth.uid() = utilisateur_id);

-- ============================================================
-- PARTIE 17 : GRANTS
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_my_organisation_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_ids TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.creer_organisation TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_on_trial TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_remaining_trial_days TO authenticated;

-- ============================================================
-- FIN - TOUTES LES TABLES ET POLICIES SONT EN PLACE
-- ============================================================
