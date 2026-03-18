# Nouveautés Essentiel et Essor

## 1. Essai Gratuit de 15 Jours

### Fonctionnalités
- **Période d'essai de 15 jours** pour tous les nouveaux utilisateurs
- **Accès complet** à toutes les fonctionnalités pendant la période d'essai
- **Notifications** par email pendant l'essai
- **Badge d'état** dans l'en-tête

### Configuration requise
- Table `users` avec les champs :
  - `trial_start_date` (timestamp)
  - `trial_end_date` (timestamp)
  - `trial_reminder_sent` (boolean)
  - `trial_ended_notification_sent` (boolean)

### Fichiers modifiés
- `src/hooks/useTrial.ts` - Gestion de la logique d'essai
- `src/components/common/TrialStatusBadge.tsx` - Affichage du statut d'essai
- `src/components/layout/Header.tsx` - Intégration du badge d'état

## 2. Rappels Administratifs

### Fonctionnalités
- **Gestion des rappels** pour les échéances administratives
- **Notifications par email** avant l'échéance
- **Tableau de bord** pour visualiser et gérer les rappels
- **Catégories prédéfinies** (TVA, Impôts, AVS, etc.)

### Configuration requise
- Table `reminders` avec les champs :
  - `id` (uuid)
  - `user_id` (uuid, référence à auth.users)
  - `title` (text)
  - `description` (text)
  - `due_date` (timestamp)
  - `status` (enum: 'todo', 'in_progress', 'done')
  - `category` (text)
  - `notification_sent` (boolean)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

### Fichiers ajoutés
- `src/pages/admin/AdminRemindersPage.tsx` - Page de gestion des rappels
- `src/hooks/useAdminReminders.ts` - Logique de gestion des rappels
- `src/services/adminReminderService.ts` - Service pour interagir avec l'API
- `supabase/functions/send-reminders/` - Fonction Edge pour les notifications

### Configuration du CRON
Un script est disponible pour configurer la tâche CRON qui envoie les rappels :

```bash
# Rendre le script exécutable
chmod +x scripts/setup-reminder-cron.sh

# Exécuter le script
export SUPABASE_ACCESS_TOKEN=votre_token_acces
export SUPABASE_PROJECT_REF=votre_ref_projet
./scripts/setup-reminder-cron.sh
```

## 3. Sécurité

### Règles RLS (Row Level Security)
Assurez-vous d'activer les politiques RLS appropriées pour la table `reminders` :

```sql
-- Autoriser la lecture pour le propriétaire
CREATE POLICY "Les utilisateurs peuvent voir leurs propres rappels"
ON public.reminders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Autoriser l'insertion pour le propriétaire
CREATE POLICY "Les utilisateurs peuvent créer des rappels"
ON public.reminders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Autoriser la mise à jour pour le propriétaire
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs rappels"
ON public.reminders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Autoriser la suppression pour le propriétaire
CREATE POLICY "Les utilisateurs peuvent supprimer leurs rappels"
ON public.reminders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

## 4. Tests

### Tests unitaires
Exécutez les tests avec :

```bash
npm test
```

### Tests manuels
1. Créez un compte pour tester la période d'essai
2. Vérifiez que le badge d'essai s'affiche correctement
3. Testez la création de rappels administratifs
4. Vérifiez la réception des emails de rappel

## 5. Déploiement

### Variables d'environnement
Assurez-vous de configurer ces variables dans votre projet Supabase :

```env
# Pour la fonction d'envoi d'emails
SUPABASE_URL=votre_url_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# Pour les emails
EMAIL_FROM=noreply@votredomaine.com
SENDGRID_API_KEY=votre_cle_sendgrid
```

### Déploiement des fonctions Edge
```bash
# Se positionner dans le dossier du projet Supabase
cd supabase

# Déployer la fonction send-reminders
supabase functions deploy send-reminders --project-ref votre_ref_projet
```
