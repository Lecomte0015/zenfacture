-- Migration: Profil Métier (Business Profiles)
-- Date: 2026-04-20
-- Ajoute le profil métier à l'organisation pour personnaliser le dashboard

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS profil_metier TEXT DEFAULT NULL
  CHECK (profil_metier IN (
    'commerce',      -- Commerce / Boutique physique ou en ligne
    'services',      -- Services / Artisan / Ménage
    'freelance',     -- Freelance / Consultant
    'restauration',  -- Restauration / Food
    'construction',  -- Construction / BTP
    'sante',         -- Santé / Bien-être
    'pme'            -- PME / Entreprise (tout activé)
  ));

-- Index pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_organisations_profil_metier
  ON organisations(profil_metier)
  WHERE profil_metier IS NOT NULL;

COMMENT ON COLUMN organisations.profil_metier IS
  'Profil métier de l''organisation pour personnaliser le dashboard. NULL = onboarding non complété.';
