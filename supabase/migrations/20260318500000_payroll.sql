-- Phase 5.4 : Module Salaires / Payroll (Swissdec)

CREATE TABLE IF NOT EXISTS public.employes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  date_naissance DATE,
  date_entree DATE NOT NULL DEFAULT CURRENT_DATE,
  date_sortie DATE,
  numero_avs TEXT, -- Numéro AVS 13 chiffres (756.xxxx.xxxx.xx)
  type_contrat TEXT DEFAULT 'cdi' CHECK (type_contrat IN ('cdi','cdd','stage','apprenti')),
  taux_activite INTEGER DEFAULT 100 CHECK (taux_activite BETWEEN 1 AND 100), -- en %
  salaire_brut_mensuel NUMERIC(10,2) NOT NULL DEFAULT 0,
  lpp_taux_employe NUMERIC(5,2) DEFAULT 5.0, -- taux LPP part employé en %
  ijm_taux NUMERIC(5,2) DEFAULT 1.5, -- indemnité journalière maladie
  impot_source BOOLEAN DEFAULT false, -- soumis à l'impôt à la source
  taux_is NUMERIC(5,2) DEFAULT 0, -- taux impôt à la source en %
  iban TEXT,
  actif BOOLEAN DEFAULT true,
  notes TEXT,
  cree_le TIMESTAMPTZ DEFAULT NOW(),
  mis_a_jour_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employes_org" ON public.employes FOR ALL USING (
  organisation_id IN (SELECT public.get_user_org_ids())
);

CREATE TABLE IF NOT EXISTS public.fiches_salaire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL,
  periode TEXT NOT NULL, -- format YYYY-MM
  salaire_brut NUMERIC(10,2) NOT NULL,
  -- Déductions employé
  avs_employe NUMERIC(10,2) DEFAULT 0, -- AVS 4.35%
  ai_employe NUMERIC(10,2) DEFAULT 0,  -- AI 0.70%
  apg_employe NUMERIC(10,2) DEFAULT 0, -- APG 0.25%
  ac_employe NUMERIC(10,2) DEFAULT 0,  -- AC 1.10% (jusqu'à 148'200)
  lpp_employe NUMERIC(10,2) DEFAULT 0, -- LPP variable
  ijm_employe NUMERIC(10,2) DEFAULT 0, -- IJM variable
  impot_source NUMERIC(10,2) DEFAULT 0,
  autres_deductions NUMERIC(10,2) DEFAULT 0,
  total_deductions NUMERIC(10,2) DEFAULT 0,
  salaire_net NUMERIC(10,2) NOT NULL,
  -- Charges patronales
  avs_employeur NUMERIC(10,2) DEFAULT 0, -- AVS 4.35%
  ai_employeur NUMERIC(10,2) DEFAULT 0,  -- AI 0.70%
  apg_employeur NUMERIC(10,2) DEFAULT 0, -- APG 0.25%
  ac_employeur NUMERIC(10,2) DEFAULT 0,  -- AC 1.10%
  lpp_employeur NUMERIC(10,2) DEFAULT 0,
  allocations_familiales NUMERIC(10,2) DEFAULT 0,
  total_charges_patronales NUMERIC(10,2) DEFAULT 0,
  cout_total_employeur NUMERIC(10,2) NOT NULL,
  -- Extras
  primes NUMERIC(10,2) DEFAULT 0,
  heures_sup NUMERIC(10,2) DEFAULT 0,
  indemnites NUMERIC(10,2) DEFAULT 0,
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon','valide','paye')),
  date_paiement DATE,
  notes TEXT,
  cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fiches_salaire ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiches_org" ON public.fiches_salaire FOR ALL USING (
  organisation_id IN (SELECT public.get_user_org_ids())
);

CREATE INDEX IF NOT EXISTS idx_employes_org ON public.employes(organisation_id);
CREATE INDEX IF NOT EXISTS idx_fiches_employe ON public.fiches_salaire(employe_id);
CREATE INDEX IF NOT EXISTS idx_fiches_periode ON public.fiches_salaire(periode);
CREATE INDEX IF NOT EXISTS idx_fiches_org ON public.fiches_salaire(organisation_id);
