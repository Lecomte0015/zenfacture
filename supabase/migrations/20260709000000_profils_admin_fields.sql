-- Migration : Colonnes admin manquantes sur profils
-- Date: 2026-07-09
-- Contexte : Le ROADMAP (Phase 2.5) documentait l'ajout de `role`, `is_active`,
-- `blocked_at`, `blocked_reason` sur profils pour le back-office admin
-- (AdminUsersPage.tsx), mais aucune migration existante ne les créait réellement.
-- Cette migration comble cet écart.

ALTER TABLE public.profils
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profils_role ON public.profils(role);

COMMENT ON COLUMN public.profils.role IS 'Rôle utilisateur: user, admin, super_admin';
COMMENT ON COLUMN public.profils.is_active IS 'Faux si l''utilisateur est bloqué par un admin';
COMMENT ON COLUMN public.profils.blocked_at IS 'Date de blocage par un admin';
COMMENT ON COLUMN public.profils.blocked_reason IS 'Raison du blocage';
