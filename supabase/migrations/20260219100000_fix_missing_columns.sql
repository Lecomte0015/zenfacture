-- ============================================================
-- FIX: Ajout de colonnes manquantes aux tables pré-existantes
-- ============================================================
-- Si les tables ont été créées avant la migration consolidée,
-- CREATE TABLE IF NOT EXISTS les a ignorées.
-- Ce script ajoute toutes les colonnes potentiellement manquantes.
-- ============================================================

-- ============================================================
-- TABLE: factures
-- ============================================================
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS client_company TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS client_city TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS client_postal_code TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS client_country TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS client_vat TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS company_city TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS company_postal_code TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS company_country TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS company_vat TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS total NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS terms TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS devise TEXT DEFAULT 'CHF';
-- Phase 2 columns
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS numero_facture TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS sous_total NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS total_tva NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS montant_total NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS conditions_paiement INTEGER DEFAULT 30;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS reference_qr TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS avoir_id UUID;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS recurrence_id UUID;

-- ============================================================
-- TABLE: clients
-- ============================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS prenom TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS entreprise TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS ville TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pays TEXT DEFAULT 'CH';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS numero_tva TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS numero_client TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS devise_preferee TEXT DEFAULT 'CHF';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS conditions_paiement INTEGER DEFAULT 30;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cree_le TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS mis_a_jour_le TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- TABLE: depenses
-- ============================================================
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CHF';
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(4,2);
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- Dépenses Phase 2 columns (si table montant existe en français)
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS montant NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS fournisseur TEXT;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS categorie TEXT;
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS devise TEXT DEFAULT 'CHF';
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(4,2);

-- ============================================================
-- TABLE: profils
-- ============================================================
ALTER TABLE public.profils ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profils ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profils ADD COLUMN IF NOT EXISTS plan_abonnement TEXT NOT NULL DEFAULT 'essentiel';
ALTER TABLE public.profils ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ;
ALTER TABLE public.profils ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;
ALTER TABLE public.profils ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profils ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profils ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================
-- TABLE: organisations
-- ============================================================
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS proprietaire_id UUID REFERENCES auth.users(id);
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS ville TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS pays TEXT DEFAULT 'CH';
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS site_web TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS numero_tva TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS cree_le TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS mis_a_jour_le TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- TABLE: rappels
-- ============================================================
ALTER TABLE public.rappels ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.rappels ADD COLUMN IF NOT EXISTS facture_id UUID REFERENCES public.factures(id) ON DELETE CASCADE;
ALTER TABLE public.rappels ADD COLUMN IF NOT EXISTS niveau INTEGER DEFAULT 1;
ALTER TABLE public.rappels ADD COLUMN IF NOT EXISTS date_envoi TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.rappels ADD COLUMN IF NOT EXISTS contenu TEXT;
ALTER TABLE public.rappels ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'envoye';
ALTER TABLE public.rappels ADD COLUMN IF NOT EXISTS cree_le TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- INDEX manquants
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_factures_organisation_id ON public.factures(organisation_id);
CREATE INDEX IF NOT EXISTS idx_factures_client_id ON public.factures(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_organisation_id ON public.clients(organisation_id);
CREATE INDEX IF NOT EXISTS idx_depenses_organisation_id ON public.depenses(organisation_id);
CREATE INDEX IF NOT EXISTS idx_rappels_organisation_id ON public.rappels(organisation_id);

-- ============================================================
-- Vérification finale
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration fix_missing_columns terminée avec succès!';
  RAISE NOTICE 'Toutes les colonnes manquantes ont été ajoutées.';
END $$;
