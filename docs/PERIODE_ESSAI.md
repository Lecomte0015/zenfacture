# Gestion de la période d'essai

Ce document décrit comment la période d'essai de 15 jours est gérée dans l'application Zenfacture.

## Fonctionnalités

- **Période d'essai de 15 jours** pour tous les nouveaux utilisateurs
- **Accès complet** à toutes les fonctionnalités premium pendant la période d'essai
- **Notifications par e-mail** à 10, 5 et 2 jours avant la fin de l'essai
- **Notification de fin d'essai** le jour de l'expiration
- **Bannière d'information** dans le tableau de bord indiquant le temps restant
- **Restriction des fonctionnalités** après la fin de la période d'essai si aucun abonnement n'est souscrit

## Schéma de la base de données

La table `profils` a été mise à jour avec les champs suivants :

- `trial_start_date` (timestamp) : Date de début de la période d'essai
- `trial_end_date` (timestamp) : Date de fin de la période d'essai (15 jours après l'inscription)
- `trial_reminder_sent` (integer[]) : Liste des rappels déjà envoyés (en jours restants)
- `trial_ended_notification_sent` (boolean) : Indique si la notification de fin d'essai a été envoyée

## Flux d'inscription

1. L'utilisateur s'inscrit avec son nom, son e-mail et un mot de passe
2. Le système crée le compte et initialise les dates d'essai :
   - `trial_start_date` = date actuelle
   - `trial_end_date` = date actuelle + 15 jours
   - `trial_reminder_sent` = tableau vide
   - `trial_ended_notification_sent` = false
3. L'utilisateur est redirigé vers le tableau de bord avec un accès complet aux fonctionnalités

## Notifications par e-mail

### Rappels d'essai

Des e-mails de rappel sont envoyés aux utilisateurs :
- 10 jours avant la fin de l'essai
- 5 jours avant la fin de l'essai
- 2 jours avant la fin de l'essai

### Notification de fin d'essai

Un e-mail est envoyé le jour de la fin de l'essai pour informer l'utilisateur que son essai est terminé.

## Gestion de l'accès aux fonctionnalités

Le composant `FeatureGuard` est utilisé pour restreindre l'accès aux fonctionnalités premium :

```tsx
import { FeatureGuard } from '@/components/FeatureGuard';

// Utilisation de base
<FeatureGuard requiredFeature="fonctionnalite_premium">
  <ComposantPremium />
</FeatureGuard>

// Avec message personnalisé
<FeatureGuard 
  requiredFeature="fonctionnalite_premium"
  message="Cette fonctionnalité nécessite un abonnement premium"
>
  <ComposantPremium />
</FeatureGuard>
```

## Fonction Edge pour les rappels

Une fonction Edge a été créée pour gérer l'envoi des e-mails de rappel :

- **Chemin** : `/supabase/functions/send-trial-reminders/`
- **Fréquence d'exécution** : Tous les jours à 9h00 (UTC)
- **Actions** :
  - Vérifie les utilisateurs en période d'essai
  - Envoie les rappels aux dates appropriées
  - Met à jour l'état des notifications dans la base de données

## Déploiement

### Prérequis

- Compte Supabase avec un projet configuré
- CLI Supabase installée
- Variables d'environnement configurées dans le tableau de bord Supabase

### Étapes de déploiement

1. Déployer la fonction Edge :
   ```bash
   supabase functions deploy send-trial-reminders --project-ref votre-ref-projet
   ```

2. Configurer le déclencheur CRON dans Supabase :
   ```sql
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
   ```

## Tests

Des tests unitaires et d'intégration sont disponibles pour s'assurer que la logique de la période d'essai fonctionne comme prévu.

## Dépannage

### Les e-mails de rappel ne sont pas envoyés

1. Vérifiez les journaux de la fonction dans le tableau de bord Supabase
2. Vérifiez que la fonction est bien déployée et activée
3. Vérifiez que le job CRON est correctement configuré
4. Vérifiez que les variables d'environnement sont correctement définies

### Un utilisateur n'a pas reçu de notification

1. Vérifiez que les dates d'essai sont correctement définies dans la table `profils`
2. Vérifiez que l'utilisateur n'a pas déjà reçu la notification (`trial_reminder_sent`)
3. Vérifiez que l'e-mail n'a pas été marqué comme spam

## Sécurité

- Les clés d'API et les informations sensibles sont stockées dans les variables d'environnement
- L'accès à la fonction est protégé par un jeton JWT
- Les e-mails contiennent uniquement des informations non sensibles

## Maintenance

- Surveillez les journaux pour détecter les échecs d'envoi d'e-mails
- Mettez à jour régulièrement les modèles d'e-mails si nécessaire
- Testez régulièrement le flux d'inscription pour vous assurer que tout fonctionne correctement
