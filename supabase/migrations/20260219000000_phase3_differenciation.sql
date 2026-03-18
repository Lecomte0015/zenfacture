-- =====================================================
-- Phase 3 : Différenciation - Fonctionnalités avancées (IDEMPOTENT)
-- Peut être exécuté plusieurs fois sans erreur
-- =====================================================

-- =====================================================
-- 1. Table ocr_scans (OCR/IA dépenses)
-- =====================================================
CREATE TABLE IF NOT EXISTS ocr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  resultat_json JSONB,
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente','en_cours','termine','erreur')),
  depense_id UUID REFERENCES depenses(id),
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Tables E-banking ISO 20022
-- =====================================================
CREATE TABLE IF NOT EXISTS comptes_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  iban TEXT NOT NULL,
  bic TEXT,
  devise TEXT DEFAULT 'CHF',
  solde NUMERIC(12,2) DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compte_id UUID NOT NULL REFERENCES comptes_bancaires(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  reference TEXT,
  montant NUMERIC(12,2) NOT NULL,
  devise TEXT DEFAULT 'CHF',
  date_valeur DATE NOT NULL,
  date_comptable DATE,
  description TEXT,
  type TEXT DEFAULT 'credit' CHECK (type IN ('credit','debit')),
  statut_rapprochement TEXT DEFAULT 'non_rapproche'
    CHECK (statut_rapprochement IN ('non_rapproche','rapproche','ignore')),
  facture_id UUID REFERENCES factures(id),
  depense_id UUID REFERENCES depenses(id),
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fichiers_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  nom_fichier TEXT NOT NULL,
  type_fichier TEXT NOT NULL CHECK (type_fichier IN ('camt053','camt054','pain001')),
  statut TEXT DEFAULT 'importe' CHECK (statut IN ('importe','traite','erreur')),
  nb_transactions INTEGER DEFAULT 0,
  date_import TIMESTAMPTZ DEFAULT NOW(),
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. Tables Comptabilité
-- =====================================================
CREATE TABLE IF NOT EXISTS plan_comptable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  nom TEXT NOT NULL,
  type_compte TEXT NOT NULL CHECK (type_compte IN ('actif','passif','charge','produit')),
  categorie TEXT,
  parent_id UUID REFERENCES plan_comptable(id),
  actif BOOLEAN DEFAULT true,
  est_systeme BOOLEAN DEFAULT false,
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercices_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  statut TEXT DEFAULT 'ouvert' CHECK (statut IN ('ouvert','cloture')),
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ecritures_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  exercice_id UUID REFERENCES exercices_comptables(id),
  numero_piece TEXT,
  date_ecriture DATE NOT NULL,
  libelle TEXT NOT NULL,
  compte_debit_id UUID REFERENCES plan_comptable(id),
  compte_credit_id UUID REFERENCES plan_comptable(id),
  montant NUMERIC(12,2) NOT NULL,
  devise TEXT DEFAULT 'CHF',
  facture_id UUID REFERENCES factures(id),
  depense_id UUID REFERENCES depenses(id),
  transaction_id UUID REFERENCES transactions_bancaires(id),
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. Table Déclarations TVA
-- =====================================================
CREATE TABLE IF NOT EXISTS declarations_tva (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  exercice_id UUID REFERENCES exercices_comptables(id),
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

-- =====================================================
-- 5. Tables eBill
-- =====================================================
CREATE TABLE IF NOT EXISTS ebill_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  participant_id TEXT,
  statut TEXT DEFAULT 'inactif' CHECK (statut IN ('inactif','en_cours','actif')),
  actif BOOLEAN DEFAULT false,
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ebill_envois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  facture_id UUID REFERENCES factures(id),
  participant_destinataire TEXT,
  statut TEXT DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente','envoye','accepte','refuse','erreur')),
  date_envoi TIMESTAMPTZ,
  date_acceptation TIMESTAMPTZ,
  reference_ebill TEXT,
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. Tables Portail Fiduciaire
-- =====================================================
CREATE TABLE IF NOT EXISTS acces_fiduciaire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email_fiduciaire TEXT NOT NULL,
  nom_fiduciaire TEXT,
  token_acces TEXT NOT NULL UNIQUE,
  permissions JSONB DEFAULT '["factures","depenses","comptabilite","tva"]',
  actif BOOLEAN DEFAULT true,
  derniere_connexion TIMESTAMPTZ,
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exports_fiduciaire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  acces_id UUID REFERENCES acces_fiduciaire(id),
  type_export TEXT NOT NULL CHECK (type_export IN ('plan_comptable','journal','bilan','tva')),
  periode_debut DATE,
  periode_fin DATE,
  fichier_url TEXT,
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. Table Imports
-- =====================================================
CREATE TABLE IF NOT EXISTS imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('bexio','cresus','generique')),
  type_donnees TEXT NOT NULL CHECK (type_donnees IN ('clients','factures','produits','depenses')),
  statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours','termine','erreur')),
  nb_lignes INTEGER DEFAULT 0,
  nb_importees INTEGER DEFAULT 0,
  nb_erreurs INTEGER DEFAULT 0,
  erreurs_detail JSONB,
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. RLS sur toutes les nouvelles tables
-- =====================================================
ALTER TABLE ocr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes_bancaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_bancaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers_bancaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_comptable ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercices_comptables ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecritures_comptables ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations_tva ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebill_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebill_envois ENABLE ROW LEVEL SECURITY;
ALTER TABLE acces_fiduciaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports_fiduciaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. Policies (DROP IF EXISTS avant CREATE)
-- =====================================================

-- Macro pour créer les policies sur chaque table
DO $$
DECLARE
  tables_list TEXT[] := ARRAY[
    'ocr_scans','comptes_bancaires','transactions_bancaires','fichiers_bancaires',
    'exercices_comptables','ecritures_comptables','declarations_tva',
    'ebill_config','ebill_envois','acces_fiduciaire','exports_fiduciaire','imports'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_list LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON %I', t, t);

    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (
      organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
    )', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (
      organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
    )', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (
      organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
    )', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (
      organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
    )', t, t);
  END LOOP;
END $$;

-- Policies spéciales pour plan_comptable (inclut les comptes système)
DO $$ BEGIN
  DROP POLICY IF EXISTS "plan_comptable_select" ON plan_comptable;
  DROP POLICY IF EXISTS "plan_comptable_insert" ON plan_comptable;
  DROP POLICY IF EXISTS "plan_comptable_update" ON plan_comptable;
  DROP POLICY IF EXISTS "plan_comptable_delete" ON plan_comptable;

  CREATE POLICY "plan_comptable_select" ON plan_comptable FOR SELECT USING (
    est_systeme = true OR organisation_id IN (
      SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid()
    )
  );
  CREATE POLICY "plan_comptable_insert" ON plan_comptable FOR INSERT WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid())
  );
  CREATE POLICY "plan_comptable_update" ON plan_comptable FOR UPDATE USING (
    est_systeme = false AND organisation_id IN (
      SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid()
    )
  );
  CREATE POLICY "plan_comptable_delete" ON plan_comptable FOR DELETE USING (
    est_systeme = false AND organisation_id IN (
      SELECT organisation_id FROM utilisateurs_organisations WHERE utilisateur_id = auth.uid()
    )
  );
END $$;

-- =====================================================
-- 10. Plan comptable PME suisse (seed)
-- =====================================================
-- Insérer seulement si aucun compte système n'existe
INSERT INTO plan_comptable (numero, nom, type_compte, categorie, est_systeme)
SELECT * FROM (VALUES
  -- Actifs (1xxx)
  ('1000', 'Caisse', 'actif', 'Liquidités', true),
  ('1020', 'Banque', 'actif', 'Liquidités', true),
  ('1100', 'Débiteurs', 'actif', 'Créances', true),
  ('1170', 'TVA préalable (impôt préalable)', 'actif', 'Créances', true),
  ('1200', 'Stock de marchandises', 'actif', 'Stocks', true),
  ('1500', 'Machines et appareils', 'actif', 'Immobilisations', true),
  ('1510', 'Mobilier de bureau', 'actif', 'Immobilisations', true),
  ('1520', 'Matériel informatique', 'actif', 'Immobilisations', true),
  -- Passifs (2xxx)
  ('2000', 'Créanciers (fournisseurs)', 'passif', 'Dettes à court terme', true),
  ('2200', 'TVA due', 'passif', 'Dettes à court terme', true),
  ('2270', 'Charges sociales dues', 'passif', 'Dettes à court terme', true),
  ('2800', 'Capital propre', 'passif', 'Capital', true),
  ('2900', 'Réserves', 'passif', 'Capital', true),
  ('2990', 'Bénéfice / Perte reporté', 'passif', 'Capital', true),
  -- Produits (3xxx)
  ('3000', 'Ventes de marchandises', 'produit', 'Chiffre d''affaires', true),
  ('3200', 'Ventes de prestations de services', 'produit', 'Chiffre d''affaires', true),
  ('3400', 'Autres produits d''exploitation', 'produit', 'Chiffre d''affaires', true),
  ('3800', 'Rabais et escomptes accordés', 'produit', 'Déductions', true),
  -- Charges matières (4xxx)
  ('4000', 'Achats de marchandises', 'charge', 'Charges matières', true),
  ('4400', 'Sous-traitance', 'charge', 'Charges matières', true),
  -- Charges personnel (5xxx)
  ('5000', 'Salaires', 'charge', 'Charges de personnel', true),
  ('5700', 'Charges sociales', 'charge', 'Charges de personnel', true),
  ('5800', 'Autres charges de personnel', 'charge', 'Charges de personnel', true),
  -- Charges exploitation (6xxx)
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
  -- Résultat hors exploitation (8xxx)
  ('8000', 'Produits hors exploitation', 'produit', 'Hors exploitation', true),
  ('8100', 'Charges hors exploitation', 'charge', 'Hors exploitation', true),
  ('8500', 'Produits exceptionnels', 'produit', 'Exceptionnel', true),
  ('8900', 'Impôts directs', 'charge', 'Impôts', true)
) AS v(numero, nom, type_compte, categorie, est_systeme)
WHERE NOT EXISTS (SELECT 1 FROM plan_comptable WHERE est_systeme = true LIMIT 1);

-- =====================================================
-- FIN Phase 3 (IDEMPOTENT)
-- =====================================================
