-- Migration pour ajouter la gestion de l'essai gratuit

-- 1. Ajout des colonnes pour la gestion de l'essai
alter table auth.users 
add column if not exists trial_start_date timestamptz,
add column if not exists trial_end_date timestamptz,
add column if not exists trial_reminder_sent boolean default false,
add column if not exists trial_ended_notification_sent boolean default false;

-- 2. Fonction pour initialiser la période d'essai
create or replace function public.initialize_trial_period()
returns trigger as $$
begin
  -- Ne définir les dates d'essai que pour les nouveaux utilisateurs
  if new.raw_user_meta_data->>'provider' = 'email' and new.trial_start_date is null then
    new.trial_start_date = now();
    new.trial_end_date = now() + interval '15 days';
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Déclencheur pour initialiser automatiquement la période d'essai
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row
  execute function public.initialize_trial_period();

-- 4. Fonction utilitaire pour vérifier si l'utilisateur est en période d'essai
create or replace function public.is_user_on_trial(user_id uuid)
returns boolean as $$
declare
  trial_end timestamptz;
begin
  select trial_end_date into trial_end
  from auth.users
  where id = user_id;
  
  return trial_end is not null and now() <= trial_end;
end;
$$ language plpgsql security definer;

-- 5. Fonction pour obtenir les jours restants d'essai
create or replace function public.get_remaining_trial_days(user_id uuid)
returns integer as $$
declare
  trial_end timestamptz;
  days_left integer;
begin
  select trial_end_date into trial_end
  from auth.users
  where id = user_id;
  
  if trial_end is null then
    return 0;
  end if;
  
  days_left := date_part('day', trial_end - now());
  return greatest(0, days_left);
end;
$$ language plpgsql security definer;

-- 6. Fonction pour envoyer un rappel d'essai
create or replace function public.send_trial_reminder(user_id uuid, days_remaining integer)
returns void as $$
declare
  user_email text;
  user_name text;
  subject text;
  message text;
begin
  -- Récupérer les informations de l'utilisateur
  select email, raw_user_meta_data->>'name' into user_email, user_name
  from auth.users
  where id = user_id;
  
  -- Définir le sujet et le message en fonction des jours restants
  if days_remaining = 1 then
    subject := 'Votre essai gratuit se termine demain !';
    message := 'Bonjour ' || coalesce(user_name, 'cher utilisateur') || E',\n\n' ||
              'Votre essai gratuit de Zenfacture se termine demain.\n\n' ||
              'Pour continuer à profiter de toutes les fonctionnalités, pensez à souscrire à un de nos abonnements.\n\n' ||
              'Cordialement,\nL\'équipe Zenfacture';
  else
    subject := 'Votre essai gratuit - ' || days_remaining || ' jours restants';
    message := 'Bonjour ' || coalesce(user_name, 'cher utilisateur') || E',\n\n' ||
              'Il vous reste ' || days_remaining || ' jours d\'essai gratuit sur Zenfacture.\n\n' ||
              'Profitez-en pour découvrir toutes nos fonctionnalités premium !\n\n' ||
              'Cordialement,\nL\'équipe Zenfacture';
  end if;
  
  -- Ici, vous devriez appeler votre service d'envoi d'emails
  -- Par exemple, en utilisant Supabase Edge Functions ou un service tiers
  -- Cet exemple est une ébauche et nécessite une implémentation réelle
  raise notice 'Envoi d\'un email à % avec le sujet: %', user_email, subject;
  
  -- Marquer le rappel comme envoyé
  update auth.users
  set trial_reminder_sent = true
  where id = user_id;
end;
$$ language plpgsql security definer;

-- 7. Fonction pour envoyer une notification de fin d'essai
create or replace function public.send_trial_ended_notification(user_id uuid)
returns void as $$
declare
  user_email text;
  user_name text;
begin
  -- Récupérer les informations de l'utilisateur
  select email, raw_user_meta_data->>'name' into user_email, user_name
  from auth.users
  where id = user_id;
  
  -- Ici, vous devriez appeler votre service d'envoi d'emails
  raise notice 'Notification de fin d\'essai envoyée à %', user_email;
  
  -- Marquer la notification comme envoyée
  update auth.users
  set trial_ended_notification_sent = true
  where id = user_id;
end;
$$ language plpgsql security definer;

-- 8. Fonction planifiée pour gérer les rappels et notifications
create or replace function public.check_trial_status()
returns void as $$
declare
  user_record record;
  days_remaining integer;
begin
  -- Parcourir les utilisateurs en période d'essai
  for user_record in 
    select id, trial_end_date, trial_reminder_sent, trial_ended_notification_sent
    from auth.users
    where trial_end_date is not null
  loop
    -- Calculer les jours restants
    days_remaining := date_part('day', user_record.trial_end_date - now())::integer;
    
    -- Si la période d'essai est terminée
    if now() > user_record.trial_end_date then
      -- Envoyer une notification de fin d'essai si pas déjà fait
      if not user_record.trial_ended_notification_sent then
        perform public.send_trial_ended_notification(user_record.id);
      end if;
    else
      -- Envoyer des rappels à J-7, J-3 et J-1
      if (days_remaining = 7 or days_remaining = 3 or days_remaining = 1) and 
         not user_record.trial_reminder_sent then
        perform public.send_trial_reminder(user_record.id, days_remaining);
      end if;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- 9. Planification de la fonction de vérification (à exécuter quotidiennement)
-- Note: Cette commande nécessite les privilèges superutilisateur
-- Elle doit être exécutée manuellement dans l'interface Supabase
/*
select cron.schedule(
  'check-trial-status',
  '0 9 * * *', -- Tous les jours à 9h00
  'select public.check_trial_status()'
);
*/
