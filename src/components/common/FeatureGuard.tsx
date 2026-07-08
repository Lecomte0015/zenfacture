import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTrial } from '../../hooks/useTrial';

type Fonctionnalite = 
  | 'multiUtilisateurs' 
  | 'api' 
  | 'supportPrioritaire' 
  | 'support24_7' 
  | 'facturationAvancee' 
  | 'exportDonnees'
  | string; // Permet d'utiliser n'importe quelle chaîne comme clé de fonctionnalité

interface FeatureGuardProps {
  children: React.ReactNode;
  requiredFeature?: Fonctionnalite;
  redirectTo?: string;
}

const FeatureGuard: React.FC<FeatureGuardProps> = ({
  children,
  requiredFeature,
  redirectTo = '/billing',
}) => {
  const { isAuthenticated, loading, aLaFonctionnalite } = useAuth();
  // Hooks doivent toujours être appelés sans condition (Rules of Hooks) —
  // on récupère canAccessFeature ici, au top-level, et non dans le bloc
  // conditionnel ci-dessous (bug corrigé lors de l'audit sécurité 2026-07-09).
  const { canAccessFeature } = useTrial();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Redirection si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  // Vérification de la fonctionnalité requise
  if (requiredFeature) {
    // Si l'utilisateur n'a pas la fonctionnalité via son abonnement,
    // vérifier s'il y accède via une période d'essai active
    if (!aLaFonctionnalite(requiredFeature) && !canAccessFeature(requiredFeature)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

export default FeatureGuard;
