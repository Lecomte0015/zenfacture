-- Migration pour corriger les erreurs du back-office admin
-- Date: 2026-02-25

-- 1. Ajouter les colonnes manquantes dans la table organisations
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'essentiel' CHECK (subscription_plan IN ('essentiel', 'pro', 'entreprise'));

-- 2. Ajouter/corriger les colonnes dans la table rappels
ALTER TABLE public.rappels
  ADD COLUMN IF NOT EXISTS date_echeance DATE;

-- 3. Si la colonne due_date existe, migrer les données vers date_echeance
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'rappels'
    AND column_name = 'due_date'
  ) THEN
    -- Migrer les données
    UPDATE public.rappels
    SET date_echeance = due_date::date
    WHERE date_echeance IS NULL AND due_date IS NOT NULL;

    -- Optionnel : supprimer l'ancienne colonne si vous ne l'utilisez plus
    -- ALTER TABLE public.rappels DROP COLUMN IF EXISTS due_date;
  END IF;
END $$;

-- 4. Mettre à jour les organisations existantes avec des valeurs par défaut
UPDATE public.organisations
SET
  subscription_status = COALESCE(subscription_status, 'trial'),
  subscription_plan = COALESCE(subscription_plan, 'essentiel')
WHERE subscription_status IS NULL OR subscription_plan IS NULL;

-- 5. Commentaires
COMMENT ON COLUMN organisations.subscription_status IS 'Statut de l''abonnement: trial, active, cancelled, expired';
COMMENT ON COLUMN organisations.subscription_plan IS 'Plan d''abonnement: essentiel, pro, entreprise';
COMMENT ON COLUMN rappels.date_echeance IS 'Date d''échéance du rappel (remplace due_date)';
