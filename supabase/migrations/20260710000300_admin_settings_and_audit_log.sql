-- Migration : tables `platform_settings` et `admin_audit_log`
--
-- Contexte : le back-office contient une page "Configuration"
-- (AdminSettingsPage.tsx) qui n'est aujourd'hui qu'une simulation --
-- `handleSave` fait un `alert('Configuration sauvegardée (simulation)')`
-- et ne persiste jamais rien en base. De même, aucune action admin
-- (blocage, déblocage, suppression, changement de rôle...) n'est tracée
-- nulle part : `AdminUsersPage.tsx` modifie `profils` directement sans
-- laisser de trace de qui a fait quoi et quand.
--
-- Cette migration crée les deux tables nécessaires pour rendre ces
-- fonctionnalités réelles, en réutilisant le pattern déjà établi dans
-- 20260710000200_fix_profils_privilege_escalation.sql : `public.is_admin()`
-- (SECURITY DEFINER, pas de récursion RLS) pour restreindre l'accès aux
-- seuls administrateurs.

-- ── 1. platform_settings ─────────────────────────────────────────────────
-- Table à une seule ligne (singleton, id fixe) contenant la configuration
-- globale de la plateforme. Un singleton plutôt qu'un schéma clé/valeur
-- car le nombre de réglages est petit et connu à l'avance, ce qui rend le
-- typage TypeScript et la lecture/écriture bien plus simples côté front.
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  -- Taux de change (utilisés pour convertir les montants dans les factures
  -- multi-devises)
  usd_to_chf NUMERIC(10, 4) NOT NULL DEFAULT 0.90,
  eur_to_chf NUMERIC(10, 4) NOT NULL DEFAULT 0.95,
  -- SMTP (envoi d'emails transactionnels)
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  smtp_from TEXT,
  -- Fonctionnement général
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  trial_days INTEGER NOT NULL DEFAULT 14,
  -- Quotas par plan (nombre de factures / mois)
  max_invoices_starter INTEGER NOT NULL DEFAULT 20,
  max_invoices_business INTEGER NOT NULL DEFAULT 200,
  -- Fonctionnalités optionnelles
  enable_ebill BOOLEAN NOT NULL DEFAULT FALSE,
  enable_api BOOLEAN NOT NULL DEFAULT FALSE,
  enable_fiduciaire BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  -- Un seul singleton possible : id est toujours TRUE
  CONSTRAINT platform_settings_singleton CHECK (id = TRUE)
);

-- Ligne singleton initiale (valeurs par défaut = celles déjà codées en dur
-- dans AdminSettingsPage.tsx avant cette migration)
INSERT INTO public.platform_settings (id)
VALUES (TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_select_admin" ON public.platform_settings;
CREATE POLICY "platform_settings_select_admin" ON public.platform_settings
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "platform_settings_update_admin" ON public.platform_settings;
CREATE POLICY "platform_settings_update_admin" ON public.platform_settings
  FOR UPDATE USING (public.is_admin());

-- Pas de policy INSERT/DELETE : la ligne singleton est créée une seule fois
-- par cette migration (service_role) ; le back-office ne fait que la lire
-- et la modifier (UPDATE).

CREATE OR REPLACE FUNCTION public.set_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_platform_settings_updated_at();

-- ── 2. admin_audit_log ───────────────────────────────────────────────────
-- Journal d'audit des actions administratives (blocage/déblocage/suppression
-- d'utilisateur, changement de rôle, modification de la configuration...).
-- Écrit par le frontend (adminAuditService.ts) juste après chaque action
-- admin réussie sur profils/organisations/platform_settings.
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  admin_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id
  ON public.admin_audit_log (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target
  ON public.admin_audit_log (target_type, target_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_log_select_admin" ON public.admin_audit_log;
CREATE POLICY "admin_audit_log_select_admin" ON public.admin_audit_log
  FOR SELECT USING (public.is_admin());

-- INSERT : un admin ne peut journaliser que ses propres actions
-- (admin_id = auth.uid()), pour éviter qu'un compte compromis attribue une
-- action à un autre admin.
DROP POLICY IF EXISTS "admin_audit_log_insert_admin" ON public.admin_audit_log;
CREATE POLICY "admin_audit_log_insert_admin" ON public.admin_audit_log
  FOR INSERT WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- Pas de policy UPDATE/DELETE : un journal d'audit est immuable, y compris
-- pour les admins eux-mêmes (seul service_role, hors RLS, pourrait purger
-- de vieilles entrées via une tâche de maintenance future).
