-- Création de la table des organisations
CREATE TABLE public.organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  proprietaire_id UUID NOT NULL REFERENCES auth.utilisateurs(id) ON DELETE CASCADE,
  cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création du type pour les rôles
CREATE TYPE role_utilisateur AS ENUM ('admin', 'membre', 'lecteur');

-- Table de liaison entre utilisateurs et organisations
CREATE TABLE public.utilisateurs_organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  utilisateur_id UUID NOT NULL REFERENCES auth.utilisateurs(id) ON DELETE CASCADE,
  role role_utilisateur NOT NULL DEFAULT 'membre',
  cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organisation_id, utilisateur_id)
);

-- Table pour les clés API
CREATE TABLE public.cles_api (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  cle TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  derniere_utilisation TIMESTAMPTZ,
  cree_par UUID REFERENCES auth.utilisateurs(id) ON DELETE SET NULL
);

-- Types pour les tickets de support
CREATE TYPE statut_ticket AS ENUM ('ouvert', 'en_cours', 'resolu');
CREATE TYPE priorite_ticket AS ENUM ('basse', 'normale', 'elevee', 'urgente');

-- Table des tickets de support
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID NOT NULL REFERENCES auth.utilisateurs(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  statut statut_ticket NOT NULL DEFAULT 'ouvert',
  priorite priorite_ticket NOT NULL DEFAULT 'normale',
  cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajout du champ de plan d'abonnement au profil utilisateur
ALTER TABLE public.profils 
ADD COLUMN IF NOT EXISTS plan_abonnement TEXT NOT NULL DEFAULT 'essentiel';

-- Index pour les performances
CREATE INDEX idx_utilisateurs_organisations_utilisateur_id ON public.utilisateurs_organisations(utilisateur_id);
CREATE INDEX idx_utilisateurs_organisations_org_id ON public.utilisateurs_organisations(organisation_id);
CREATE INDEX idx_tickets_utilisateur_id ON public.tickets(utilisateur_id);
CREATE INDEX idx_tickets_org_id ON public.tickets(organisation_id);

-- Politiques RLS pour les organisations
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs organisations
CREATE POLICY "Les utilisateurs peuvent voir leurs organisations"
  ON public.organisations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.utilisateurs_organisations 
    WHERE utilisateurs_organisations.organisation_id = organisations.id 
    AND utilisateurs_organisations.utilisateur_id = auth.uid()
  ));

-- Politique pour permettre aux administrateurs de créer des organisations
CREATE POLICY "Les administrateurs peuvent créer des organisations"
  ON public.organisations FOR INSERT
  WITH CHECK (auth.uid() = proprietaire_id);

-- Politique pour permettre aux administrateurs de mettre à jour leurs organisations
CREATE POLICY "Les administrateurs peuvent mettre à jour leurs organisations"
  ON public.organisations FOR UPDATE
  USING (auth.uid() = proprietaire_id);

-- Politiques RLS pour utilisateurs_organisations
ALTER TABLE public.utilisateurs_organisations ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs appartenances aux organisations
CREATE POLICY "Les utilisateurs peuvent voir leurs appartenances aux organisations"
  ON public.utilisateurs_organisations FOR SELECT
  USING (utilisateur_id = auth.uid() OR 
         EXISTS (
           SELECT 1 FROM public.utilisateurs_organisations uo
           WHERE uo.organisation_id = utilisateurs_organisations.organisation_id
           AND uo.utilisateur_id = auth.uid()
           AND uo.role = 'admin'
         ));

-- Politique pour permettre aux administrateurs d'ajouter des membres
CREATE POLICY "Les administrateurs peuvent ajouter des membres"
  ON public.utilisateurs_organisations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.utilisateurs_organisations
      WHERE organisation_id = utilisateurs_organisations.organisation_id
      AND utilisateur_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Politiques RLS pour les clés API
ALTER TABLE public.cles_api ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux administrateurs de gérer les clés API de leur organisation
CREATE POLICY "Les administrateurs peuvent gérer les clés API de leur organisation"
  ON public.cles_api
  USING (
    EXISTS (
      SELECT 1 FROM public.utilisateurs_organisations
      WHERE utilisateur_id = auth.uid()
      AND organisation_id = cles_api.organisation_id
      AND role = 'admin'
    )
  );

-- Politiques RLS pour les tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir et créer leurs propres tickets
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres tickets"
  ON public.tickets
  USING (utilisateur_id = auth.uid() OR 
         (EXISTS (
           SELECT 1 FROM public.utilisateurs_organisations
           WHERE utilisateur_id = auth.uid()
           AND organisation_id = tickets.organisation_id
           AND role = 'admin'
         )));

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

-- Fonction pour créer une organisation avec l'utilisateur actuel comme propriétaire
CREATE OR REPLACE FUNCTION creer_organisation(nom_organisation TEXT)
RETURNS UUID AS $$
DECLARE
  nouvelle_org_id UUID;
BEGIN
  INSERT INTO public.organisations (nom, proprietaire_id)
  VALUES (nom_organisation, auth.uid())
  RETURNING id INTO nouvelle_org_id;
  
  -- Ajouter l'utilisateur actuel comme admin de l'organisation
  INSERT INTO public.utilisateurs_organisations (organisation_id, utilisateur_id, role)
  VALUES (nouvelle_org_id, auth.uid(), 'admin');
  
  RETURN nouvelle_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
