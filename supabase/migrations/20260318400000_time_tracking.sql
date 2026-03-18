-- Phase 5.3 : Time Tracking & Gestion de projets

CREATE TABLE IF NOT EXISTS public.projets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  client_id UUID,
  nom TEXT NOT NULL,
  description TEXT,
  tarif_horaire NUMERIC(10,2) DEFAULT 0,
  budget_heures NUMERIC(10,2),
  devise TEXT DEFAULT 'CHF',
  statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif','pause','termine','archive')),
  date_debut DATE,
  date_fin DATE,
  couleur TEXT DEFAULT '#3B82F6',
  cree_le TIMESTAMPTZ DEFAULT NOW(),
  mis_a_jour_le TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projets_org" ON public.projets FOR ALL USING (
  organisation_id IN (
    SELECT organisation_id FROM public.organization_users WHERE user_id = auth.uid()
    UNION SELECT id FROM public.organisations WHERE user_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS public.sessions_temps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id UUID NOT NULL REFERENCES public.projets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  description TEXT,
  debut_at TIMESTAMPTZ,
  fin_at TIMESTAMPTZ,
  duree_minutes INTEGER, -- calculée ou saisie manuellement
  facturable BOOLEAN DEFAULT true,
  facture BOOLEAN DEFAULT false,
  facture_id UUID, -- lien vers la facture si cette session a été facturée
  cree_le TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sessions_temps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_user" ON public.sessions_temps FOR ALL USING (
  projet_id IN (SELECT id FROM public.projets WHERE organisation_id IN (
    SELECT organisation_id FROM public.organization_users WHERE user_id = auth.uid()
    UNION SELECT id FROM public.organisations WHERE user_id = auth.uid()
  ))
);

CREATE TABLE IF NOT EXISTS public.taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id UUID NOT NULL REFERENCES public.projets(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  statut TEXT DEFAULT 'a_faire' CHECK (statut IN ('a_faire','en_cours','termine')),
  heures_estimees NUMERIC(5,2),
  heures_reelles NUMERIC(5,2) DEFAULT 0,
  assignee_id UUID REFERENCES auth.users(id),
  priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse','normale','haute','urgente')),
  date_echeance DATE,
  cree_le TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taches_projet" ON public.taches FOR ALL USING (
  projet_id IN (SELECT id FROM public.projets WHERE organisation_id IN (
    SELECT organisation_id FROM public.organization_users WHERE user_id = auth.uid()
    UNION SELECT id FROM public.organisations WHERE user_id = auth.uid()
  ))
);

-- Index
CREATE INDEX IF NOT EXISTS idx_projets_org ON public.projets(organisation_id);
CREATE INDEX IF NOT EXISTS idx_sessions_projet ON public.sessions_temps(projet_id);
CREATE INDEX IF NOT EXISTS idx_sessions_debut ON public.sessions_temps(debut_at);
CREATE INDEX IF NOT EXISTS idx_taches_projet ON public.taches(projet_id);
