-- =====================================================
-- Phase 2 : Fonctionnalités essentielles (IDEMPOTENT)
-- Peut être exécuté plusieurs fois sans erreur
-- =====================================================

-- =====================================================
-- 1. Enrichir la table clients (créée en Phase 1)
-- =====================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero_client TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS devise_preferee TEXT DEFAULT 'CHF';
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS conditions_paiement INTEGER DEFAULT 30;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS mis_a_jour_le TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- =====================================================
-- 2. Table produits
-- =====================================================
CREATE TABLE IF NOT EXISTS produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
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

-- =====================================================
-- 3. Table templates_facture
-- =====================================================
CREATE TABLE IF NOT EXISTS templates_facture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  est_defaut BOOLEAN DEFAULT false,
  est_systeme BOOLEAN DEFAULT false,
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. Table devis
-- =====================================================
CREATE TABLE IF NOT EXISTS devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
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

-- =====================================================
-- 5. Table avoirs (notes de crédit)
-- =====================================================
CREATE TABLE IF NOT EXISTS avoirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
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

-- =====================================================
-- 6. Table factures_recurrentes
-- =====================================================
CREATE TABLE IF NOT EXISTS factures_recurrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
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

-- =====================================================
-- 7. Enrichir la table factures (si elle existe)
-- =====================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'factures') THEN
    ALTER TABLE factures ADD COLUMN IF NOT EXISTS devise TEXT DEFAULT 'CHF';
    -- Ajouter client_id seulement si la colonne n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factures' AND column_name = 'client_id') THEN
      ALTER TABLE factures ADD COLUMN client_id UUID REFERENCES clients(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factures' AND column_name = 'template_id') THEN
      ALTER TABLE factures ADD COLUMN template_id UUID REFERENCES templates_facture(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factures' AND column_name = 'facture_recurrente_id') THEN
      ALTER TABLE factures ADD COLUMN facture_recurrente_id UUID REFERENCES factures_recurrentes(id);
    END IF;
  END IF;
END $$;

-- =====================================================
-- 8. Enrichir la table rappels (créée en Phase 1)
-- =====================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rappels') THEN
    ALTER TABLE rappels ADD COLUMN IF NOT EXISTS type_rappel TEXT DEFAULT 'manuel';
    ALTER TABLE rappels ADD COLUMN IF NOT EXISTS niveau INTEGER DEFAULT 1;
    ALTER TABLE rappels ADD COLUMN IF NOT EXISTS date_envoi TIMESTAMPTZ;
    ALTER TABLE rappels ADD COLUMN IF NOT EXISTS contenu TEXT;
    ALTER TABLE rappels ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    ALTER TABLE rappels ADD COLUMN IF NOT EXISTS facture_id UUID;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Colonnes rappels : certaines existent déjà';
END $$;

-- =====================================================
-- 9. RLS sur toutes les nouvelles tables
-- =====================================================
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE avoirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures_recurrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_facture ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. Policies (DROP IF EXISTS avant CREATE)
-- =====================================================

-- Produits
DO $$ BEGIN
  DROP POLICY IF EXISTS "produits_select" ON produits;
  DROP POLICY IF EXISTS "produits_insert" ON produits;
  DROP POLICY IF EXISTS "produits_update" ON produits;
  DROP POLICY IF EXISTS "produits_delete" ON produits;

  CREATE POLICY "produits_select" ON produits FOR SELECT USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "produits_insert" ON produits FOR INSERT WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "produits_update" ON produits FOR UPDATE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "produits_delete" ON produits FOR DELETE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
END $$;

-- Devis
DO $$ BEGIN
  DROP POLICY IF EXISTS "devis_select" ON devis;
  DROP POLICY IF EXISTS "devis_insert" ON devis;
  DROP POLICY IF EXISTS "devis_update" ON devis;
  DROP POLICY IF EXISTS "devis_delete" ON devis;

  CREATE POLICY "devis_select" ON devis FOR SELECT USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "devis_insert" ON devis FOR INSERT WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "devis_update" ON devis FOR UPDATE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "devis_delete" ON devis FOR DELETE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
END $$;

-- Avoirs
DO $$ BEGIN
  DROP POLICY IF EXISTS "avoirs_select" ON avoirs;
  DROP POLICY IF EXISTS "avoirs_insert" ON avoirs;
  DROP POLICY IF EXISTS "avoirs_update" ON avoirs;
  DROP POLICY IF EXISTS "avoirs_delete" ON avoirs;

  CREATE POLICY "avoirs_select" ON avoirs FOR SELECT USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "avoirs_insert" ON avoirs FOR INSERT WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "avoirs_update" ON avoirs FOR UPDATE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "avoirs_delete" ON avoirs FOR DELETE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
END $$;

-- Factures récurrentes
DO $$ BEGIN
  DROP POLICY IF EXISTS "factures_recurrentes_select" ON factures_recurrentes;
  DROP POLICY IF EXISTS "factures_recurrentes_insert" ON factures_recurrentes;
  DROP POLICY IF EXISTS "factures_recurrentes_update" ON factures_recurrentes;
  DROP POLICY IF EXISTS "factures_recurrentes_delete" ON factures_recurrentes;

  CREATE POLICY "factures_recurrentes_select" ON factures_recurrentes FOR SELECT USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "factures_recurrentes_insert" ON factures_recurrentes FOR INSERT WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "factures_recurrentes_update" ON factures_recurrentes FOR UPDATE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "factures_recurrentes_delete" ON factures_recurrentes FOR DELETE USING (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
END $$;

-- Templates facture
DO $$ BEGIN
  DROP POLICY IF EXISTS "templates_select" ON templates_facture;
  DROP POLICY IF EXISTS "templates_insert" ON templates_facture;
  DROP POLICY IF EXISTS "templates_update" ON templates_facture;
  DROP POLICY IF EXISTS "templates_delete" ON templates_facture;

  CREATE POLICY "templates_select" ON templates_facture FOR SELECT USING (
    est_systeme = true OR organisation_id IN (
      SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid()
    )
  );
  CREATE POLICY "templates_insert" ON templates_facture FOR INSERT WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "templates_update" ON templates_facture FOR UPDATE USING (
    est_systeme = false AND organisation_id IN (
      SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid()
    )
  );
  CREATE POLICY "templates_delete" ON templates_facture FOR DELETE USING (
    est_systeme = false AND organisation_id IN (
      SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid()
    )
  );
END $$;

-- =====================================================
-- 11. Templates système (3 designs de base)
-- =====================================================
-- Insérer seulement si aucun template système n'existe
INSERT INTO templates_facture (nom, description, est_systeme, config)
SELECT 'Classique', 'Design épuré et professionnel', true,
  '{"couleur_primaire":"#1a56db","couleur_secondaire":"#6b7280","police":"Helvetica","mise_en_page":"standard"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM templates_facture WHERE nom = 'Classique' AND est_systeme = true);

INSERT INTO templates_facture (nom, description, est_systeme, config)
SELECT 'Moderne', 'Design contemporain avec accents de couleur', true,
  '{"couleur_primaire":"#059669","couleur_secondaire":"#374151","police":"Arial","mise_en_page":"moderne"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM templates_facture WHERE nom = 'Moderne' AND est_systeme = true);

INSERT INTO templates_facture (nom, description, est_systeme, config)
SELECT 'Minimaliste', 'Design sobre et minimaliste', true,
  '{"couleur_primaire":"#111827","couleur_secondaire":"#9ca3af","police":"Helvetica","mise_en_page":"minimal"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM templates_facture WHERE nom = 'Minimaliste' AND est_systeme = true);

-- =====================================================
-- FIN Phase 2 (IDEMPOTENT)
-- =====================================================
