-- Migration pour ajouter la gestion de l'essai gratuit

-- Ajout des colonnes pour la gestion de l'essai
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_ended_notification_sent BOOLEAN DEFAULT FALSE;

-- Fonction pour initialiser la période d'essai
CREATE OR REPLACE FUNCTION public.initialize_trial_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne définir les dates d'essai que pour les nouveaux utilisateurs
  IF NEW.raw_user_meta_data->>'provider' = 'email' AND NEW.trial_start_date IS NULL THEN
    NEW.trial_start_date = NOW();
    NEW.trial_end_date = NOW() + INTERVAL '15 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheur pour initialiser automatiquement la période d'essai
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_trial_period();

-- Fonction utilitaire pour vérifier si l'utilisateur est en période d'essai
CREATE OR REPLACE FUNCTION public.is_user_on_trial(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_end TIMESTAMPTZ;
BEGIN
  SELECT trial_end_date INTO trial_end
  FROM auth.users
  WHERE id = user_id;
  
  RETURN trial_end IS NOT NULL AND NOW() <= trial_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les jours restants d'essai
CREATE OR REPLACE FUNCTION public.get_remaining_trial_days(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  trial_end TIMESTAMPTZ;
  days_left INTEGER;
BEGIN
  SELECT trial_end_date INTO trial_end
  FROM auth.users
  WHERE id = user_id;
  
  IF trial_end IS NULL THEN
    RETURN 0;
  END IF;
  
  days_left := DATE_PART('day', trial_end - NOW());
  RETURN GREATEST(0, days_left);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
