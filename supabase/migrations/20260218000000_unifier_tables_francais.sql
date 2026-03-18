-- ============================================================
-- ZENFACTURE - Unification des tables en français (IDEMPOTENT)
-- ============================================================
-- Peut être exécuté plusieurs fois sans erreur
-- ============================================================

-- 1. Ajouter les colonnes manquantes à organisations (si la table existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organisations') THEN
    ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS adresse TEXT;
    ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS code_postal TEXT;
    ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS ville TEXT;
    ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS pays TEXT DEFAULT 'CH';
    ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS iban TEXT;
    ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS numero_tva TEXT;
    ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS telephone TEXT;
  END IF;
END $$;

-- 2. Ajouter les colonnes manquantes à utilisateurs_organisations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'utilisateurs_organisations') THEN
    ALTER TABLE public.utilisateurs_organisations ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';
    ALTER TABLE public.utilisateurs_organisations ADD COLUMN IF NOT EXISTS mis_a_jour_le TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 3. Renommer invoices → factures (seulement si invoices existe et factures n'existe pas)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'factures') THEN
    ALTER TABLE public.invoices RENAME TO factures;
    RAISE NOTICE 'Table invoices renommée en factures';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'factures') THEN
    RAISE NOTICE 'Ni invoices ni factures n''existe - la table sera créée par la migration consolidée';
  ELSE
    RAISE NOTICE 'Table factures existe déjà, pas de renommage nécessaire';
  END IF;
END $$;

-- Trigger pour factures (si la table existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'factures') THEN
    DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.factures;
    DROP TRIGGER IF EXISTS update_factures_updated_at ON public.factures;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
      CREATE TRIGGER update_factures_updated_at
        BEFORE UPDATE ON public.factures
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END $$;

-- 4. Renommer expenses → depenses (seulement si expenses existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'depenses') THEN
    ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_organization_id_fkey;
    ALTER TABLE public.expenses RENAME TO depenses;
    -- Renommer la colonne si elle existe encore en anglais
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'depenses' AND column_name = 'organization_id') THEN
      ALTER TABLE public.depenses RENAME COLUMN organization_id TO organisation_id;
    END IF;
    ALTER TABLE public.depenses
      ADD CONSTRAINT depenses_organisation_id_fkey
      FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Table expenses renommée en depenses';
  ELSE
    RAISE NOTICE 'Renommage expenses → depenses non nécessaire';
  END IF;
END $$;

-- Trigger pour depenses
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'depenses') THEN
    DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.depenses;
    DROP TRIGGER IF EXISTS update_depenses_updated_at ON public.depenses;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
      CREATE TRIGGER update_depenses_updated_at
        BEFORE UPDATE ON public.depenses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END $$;

-- 5. Renommer organization_invitations → invitations_organisation
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_invitations')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invitations_organisation') THEN
    ALTER TABLE public.organization_invitations DROP CONSTRAINT IF EXISTS organization_invitations_organization_id_fkey;
    ALTER TABLE public.organization_invitations RENAME TO invitations_organisation;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations_organisation' AND column_name = 'organization_id') THEN
      ALTER TABLE public.invitations_organisation RENAME COLUMN organization_id TO organisation_id;
    END IF;
    ALTER TABLE public.invitations_organisation
      ADD CONSTRAINT invitations_organisation_organisation_id_fkey
      FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Table organization_invitations renommée en invitations_organisation';
  ELSE
    RAISE NOTICE 'Renommage organization_invitations non nécessaire';
  END IF;
END $$;

-- 6. Créer la table clients (dédiée)
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
  cree_le TIMESTAMPTZ DEFAULT NOW(),
  mis_a_jour_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policies clients (idempotent avec DROP IF EXISTS)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres clients" ON public.clients;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des clients" ON public.clients;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs clients" ON public.clients;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs clients" ON public.clients;
  DROP POLICY IF EXISTS "clients_select" ON public.clients;
  DROP POLICY IF EXISTS "clients_insert" ON public.clients;
  DROP POLICY IF EXISTS "clients_update" ON public.clients;
  DROP POLICY IF EXISTS "clients_delete" ON public.clients;

  CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_organisation_id ON public.clients(organisation_id);

-- 7. Créer la table rappels (ou s'assurer qu'elle a les bonnes colonnes)
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

-- Si la table existait déjà sans organisation_id, l'ajouter
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rappels')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rappels' AND column_name = 'organisation_id') THEN
    ALTER TABLE public.rappels ADD COLUMN organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Colonne organisation_id ajoutée à rappels';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rappels')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rappels' AND column_name = 'facture_id') THEN
    ALTER TABLE public.rappels ADD COLUMN facture_id UUID;
    RAISE NOTICE 'Colonne facture_id ajoutée à rappels';
  END IF;
END $$;

ALTER TABLE public.rappels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer leurs propres rappels" ON public.rappels;
  DROP POLICY IF EXISTS "rappels_select" ON public.rappels;
  DROP POLICY IF EXISTS "rappels_insert" ON public.rappels;
  DROP POLICY IF EXISTS "rappels_update" ON public.rappels;
  DROP POLICY IF EXISTS "rappels_delete" ON public.rappels;

  CREATE POLICY "rappels_select" ON public.rappels FOR SELECT USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "rappels_insert" ON public.rappels FOR INSERT WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "rappels_update" ON public.rappels FOR UPDATE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "rappels_delete" ON public.rappels FOR DELETE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
END $$;

-- 8. Supprimer les tables anglaises redondantes (si elles existent)
DROP VIEW IF EXISTS public.user_organizations;
DROP FUNCTION IF EXISTS public.create_organization_for_user(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.ensure_user_has_organization(UUID);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members') THEN
    DROP POLICY IF EXISTS "Members can view their organization members" ON public.organization_members;
    DROP POLICY IF EXISTS "All operations on organization_members" ON public.organization_members;
    DROP TABLE public.organization_members CASCADE;
    RAISE NOTICE 'Table organization_members supprimée';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
    DROP POLICY IF EXISTS "Authenticated users can read organizations" ON public.organizations;
    DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
    DROP TABLE public.organizations CASCADE;
    RAISE NOTICE 'Table organizations supprimée';
  END IF;
END $$;

-- ============================================================
-- FIN DE LA MIGRATION D'UNIFICATION (IDEMPOTENT)
-- ============================================================
