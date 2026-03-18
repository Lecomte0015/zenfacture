# Authentification et Gestion des Abonnements

Ce document explique comment utiliser le système d'authentification et de gestion des abonnements dans l'application ZenFacture.

## Table des matières

1. [Authentification Utilisateur](#authentification-utilisateur)
   - [Connexion](#connexion)
   - [Inscription](#inscription)
   - [Déconnexion](#déconnexion)

2. [Gestion des Abonnements](#gestion-des-abonnements)
   - [Fonctionnalités par Plan](#fonctionnalités-par-plan)
   - [Vérification des Autorisations](#vérification-des-autorisations)

3. [Protection des Routes](#protection-des-routes)
   - [Authentification Requise](#authentification-requise)
   - [Vérification des Fonctionnalités](#vérification-des-fonctionnalités)

4. [Webhooks](#webhooks)
   - [Événements Supportés](#événements-supportés)
   - [Configuration](#configuration)

## Authentification Utilisateur

### Connexion

```tsx
import { useAuth } from '../context/AuthContext';

function LoginForm() {
  const { login, loading, error } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirection après connexion réussie
    } catch (err) {
      // Gestion des erreurs
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Champs de formulaire */}
      <button type="submit" disabled={loading}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Inscription

```tsx
const { register, loading, error } = useAuth();

const handleRegister = async (name: string, email: string, password: string) => {
  try {
    const { user, session } = await register(name, email, password);
    // Redirection après inscription réussie
  } catch (err) {
    // Gestion des erreurs
  }
};
```

### Déconnexion

```tsx
const { logout } = useAuth();

const handleLogout = async () => {
  try {
    await logout();
    // Redirection après déconnexion
  } catch (err) {
    console.error('Erreur lors de la déconnexion:', err);
  }
};
```

## Gestion des Abonnements

### Fonctionnalités par Plan

| Fonctionnalité        | Essentiel | Professionnel | Entreprise |
|-----------------------|-----------|---------------|------------|
| Création de factures  | ✓         | ✓             | ✓          |
| Support prioritaire   |           | ✓             | ✓          |
| Facturation avancée   |           | ✓             | ✓          |
| Export de données     |           | ✓             | ✓          |
| Multi-utilisateurs    |           |               | ✓          |
| Accès API             |           |               | ✓          |
| Support 24/7         |           |               | ✓          |

### Vérification des Autorisations

```tsx
const { user, aLaFonctionnalite } = useAuth();

// Vérifier si l'utilisateur a accès à une fonctionnalité
const aAccesAPI = aLaFonctionnalite('api');

// Afficher un composant conditionnellement
{user && aLaFonctionnalite('facturationAvancee') && (
  <BoutonFacturationAvancee />
)}
```

## Protection des Routes

### Authentification Requise

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RouteProtegee({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Chargement...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }
  
  return children;
}
```

### Vérification des Fonctionnalités

```tsx
import FeatureGuard from '../components/common/FeatureGuard';

// Protection d'une route avec vérification de fonctionnalité
<Route
  path="/tableau-de-bord"
  element={
    <FeatureGuard requiredFeature="facturationAvancee">
      <TableauDeBord />
    </FeatureGuard>
  }
/>
```

## Webhooks

### Événements Supportés

- `user.created` - Déclenché à la création d'un nouvel utilisateur
- `user.updated` - Déclenché lors de la mise à jour d'un utilisateur
- `user.deleted` - Déclenché à la suppression d'un utilisateur
- `subscription.updated` - Déclenché lors de la mise à jour d'un abonnement

### Configuration

1. Créez un fichier `.env.local` à la racine du projet :

```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
WEBHOOK_SECRET=votre_secret_webhook
```

2. Configurez les webhooks dans le tableau de bord Supabase pour pointer vers :

```
https://votredomaine.com/api/webhooks
```

3. Assurez-vous d'inclure l'en-tête d'autorisation dans vos requêtes :

```
Authorization: Bearer ${WEBHOOK_SECRET}
```

## Dépannage

### Problèmes Courants

1. **Erreur d'authentification**
   - Vérifiez que les clés d'API Supabase sont correctement configurées
   - Assurez-vous que l'utilisateur a un profil valide dans la table `profils`

2. **Problèmes de permissions**
   - Vérifiez que les politiques RLS sont correctement configurées dans Supabase
   - Assurez-vous que l'utilisateur a le bon plan d'abonnement

3. **Webhooks non reçus**
   - Vérifiez que l'URL du webhook est correcte
   - Vérifiez les journaux côté serveur pour les erreurs
   - Assurez-vous que le secret du webhook correspond

## Sécurité

- Ne jamais exposer les clés d'API côté client
- Utiliser toujours HTTPS en production
- Mettre en place une politique de sécurité du contenu (CSP)
- Mettre à jour régulièrement les dépendances
- Implémenter une limitation de taux pour les API publiques
