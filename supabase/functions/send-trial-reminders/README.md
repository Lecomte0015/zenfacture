# Fonction d'envoi de rappels d'essai

Cette fonction envoie des e-mails de rappel aux utilisateurs pendant leur période d'essai et une notification lorsque l'essai est terminé.

## Fonctionnalités

- Envoie des rappels à 10, 5 et 2 jours avant la fin de la période d'essai
- Envoie une notification le jour de la fin de l'essai
- Met à jour l'état des notifications dans la base de données pour éviter les doublons

## Configuration requise

1. Assurez-vous que la table `profils` contient les champs suivants :
   - `trial_end_date` (timestamp) : date de fin de la période d'essai
   - `trial_reminder_sent` (array d'entiers) : liste des rappels déjà envoyés
   - `trial_ended_notification_sent` (booléen) : si la notification de fin d'essai a été envoyée

2. Configurez les variables d'environnement dans le fichier `config.toml` ou dans les paramètres de la fonction sur Supabase.

## Déploiement

1. Installez la CLI Supabase :
   ```bash
   npm install -g supabase
   ```

2. Connectez-vous à votre compte Supabase :
   ```bash
   supabase login
   ```

3. Déployez la fonction :
   ```bash
   supabase functions deploy send-trial-reminders --project-ref votre-ref-projet
   ```

## Configuration du déclencheur CRON

Pour exécuter cette fonction tous les jours à 9h00 (UTC), exécutez la commande SQL suivante dans l'éditeur SQL de Supabase :

```sql
-- Créer ou mettre à jour le job CRON
select
  cron.schedule(
    'send-trial-reminders-daily',
    '0 9 * * *', -- Tous les jours à 9h00 UTC
    $$
    select
      net.http_post(
        url := 'https://VOTRE_REF_PROJET.supabase.co/functions/v1/send-trial-reminders',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer VOTRE_SERVICE_ROLE_KEY"}'::jsonb,
        body := '{}'::jsonb
      ) as request_id;
    $$
  );

-- Vérifier les jobs CRON planifiés
select * from cron.job;

-- Supprimer un job CRON (si nécessaire)
-- select cron.unschedule('send-trial-reminders-daily');
```

Remplacez `VOTRE_REF_PROJET` par la référence de votre projet Supabase et `VOTRE_SERVICE_ROLE_KEY` par votre clé de service.

## Test local

Pour tester la fonction localement :

1. Installez Deno : https://deno.land/manual/getting_started/installation

2. Installez les dépendances :
   ```bash
   deno cache --import-map=import_map.json index.ts
   ```

3. Lancez le serveur de développement :
   ```bash
   supabase functions serve send-trial-reminders --no-verify-jwt
   ```

4. Testez avec curl :
   ```bash
   curl -X POST http://localhost:54321/functions/v1/send-trial-reminders \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

## Journalisation

Les journaux de la fonction sont disponibles dans la section "Logs" de l'interface Supabase pour les fonctions Edge.
