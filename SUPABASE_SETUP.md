# Configuration de Supabase pour ZenFacture

Ce guide vous explique comment configurer Supabase pour votre application ZenFacture.

## 1. Configuration de Supabase

1. Créez un compte sur [Supabase](https://supabase.com/)
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé anonyme (anon key) depuis les paramètres du projet > API

## 2. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
```

## 3. Configuration de la base de données

1. Allez dans l'éditeur SQL de Supabase
2. Copiez-collez le contenu du fichier `supabase/migrations/20240101000000_create_invoices_table.sql`
3. Exécutez le script SQL

## 4. Activation de l'authentification par email/mot de passe

1. Dans le tableau de bord Supabase, allez dans "Authentication" > "Providers"
2. Activez "Email"
3. Configurez les paramètres d'e-mail selon vos besoins
4. Dans "Site URL", ajoutez `http://localhost:5173` pour le développement
5. Dans "Redirect URLs", ajoutez `http://localhost:5173/auth/callback`

## 5. Configuration des politiques RLS (Row Level Security)

Les politiques RLS ont été configurées dans le script SQL pour que :
- Les utilisateurs ne puissent voir que leurs propres factures
- Les utilisateurs ne puissent modifier que leurs propres factures
- Les utilisateurs ne puissent supprimer que leurs propres factures

## 6. Démarrage de l'application

1. Installez les dépendances :
   ```bash
   npm install
   ```

2. Démarrez l'application en mode développement :
   ```bash
   npm run dev
   ```

## 7. Déploiement

Pour le déploiement en production, assurez-vous de :
1. Mettre à jour les URLs de redirection dans les paramètres d'authentification Supabase
2. Configurer un domaine personnalisé si nécessaire
3. Activer HTTPS
4. Configurer les politiques de conservation des logs et de sécurité appropriées

## 8. Sécurité

- Ne partagez jamais votre clé `service_role`
- Utilisez toujours HTTPS en production
- Mettez régulièrement à jour les dépendances
- Configurez des sauvegardes automatiques de votre base de données

## 9. Dépannage

### Problèmes d'authentification
- Vérifiez que les URLs de redirection sont correctement configurées
- Assurez-vous que l'authentification par email est activée dans Supabase

### Problèmes de base de données
- Vérifiez que les politiques RLS sont correctement configurées
- Assurez-vous que l'utilisateur est bien connecté avant d'accéder aux données protégées

### Problèmes de CORS
- Vérifiez que les origines autorisées sont correctement configurées dans les paramètres d'API de Supabase
