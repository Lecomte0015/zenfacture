-- Migration : Création de la table admin_reminders
-- Date: 2026-03-17
-- Raison: La table rappels est pour les rappels de paiement de factures.
--         admin_reminders est pour les rappels administratifs (TVA, impôts, AVS, etc.)

CREATE TABLE IF NOT EXISTS public.admin_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  category TEXT NOT NULL DEFAULT 'Autre',
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS admin_reminders_user_id_idx ON public.admin_reminders(user_id);
CREATE INDEX IF NOT EXISTS admin_reminders_due_date_idx ON public.admin_reminders(due_date);
CREATE INDEX IF NOT EXISTS admin_reminders_status_idx ON public.admin_reminders(status);

-- Activer RLS
ALTER TABLE public.admin_reminders ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "admin_reminders_select" ON public.admin_reminders;
CREATE POLICY "admin_reminders_select" ON public.admin_reminders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_reminders_insert" ON public.admin_reminders;
CREATE POLICY "admin_reminders_insert" ON public.admin_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_reminders_update" ON public.admin_reminders;
CREATE POLICY "admin_reminders_update" ON public.admin_reminders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_reminders_delete" ON public.admin_reminders;
CREATE POLICY "admin_reminders_delete" ON public.admin_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_admin_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_reminders_updated_at ON public.admin_reminders;
CREATE TRIGGER admin_reminders_updated_at
  BEFORE UPDATE ON public.admin_reminders
  FOR EACH ROW EXECUTE FUNCTION update_admin_reminders_updated_at();

-- Commentaires
COMMENT ON TABLE public.admin_reminders IS 'Rappels administratifs (TVA, impôts, AVS, etc.)';
COMMENT ON COLUMN public.admin_reminders.status IS 'Statut: todo, in_progress, done';
COMMENT ON COLUMN public.admin_reminders.category IS 'Catégorie: TVA, Impôt sur le revenu, AVS, LPP, etc.';
