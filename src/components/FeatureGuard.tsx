import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTrial } from '@/hooks/useTrial';

interface FeatureGuardProps {
  children: ReactNode;
  requiredFeature?: string;
  showUpgradePrompt?: boolean;
}

export const FeatureGuard = ({
  children,
  requiredFeature,
  showUpgradePrompt = true,
}: FeatureGuardProps) => {
  const { user } = useAuth();
  const { isOnTrial, isTrialExpired } = useTrial();
  const navigate = useNavigate();

  // Vérifier si l'utilisateur a accès à la fonctionnalité
  const hasAccess = () => {
    // Si l'utilisateur est admin, il a accès à tout
    if (user?.role === 'admin') return true;
    
    // Si une fonctionnalité spécifique est requise, vérifier si l'utilisateur l'a
    if (requiredFeature) {
      return user?.fonctionnalites?.[requiredFeature] === true;
    }
    
    // Par défaut, l'accès est accordé si l'utilisateur est connecté
    return !!user;
  };

  // Si l'utilisateur a accès, afficher le contenu
  if (hasAccess()) {
    return <>{children}</>;
  }

  // Si l'utilisateur n'a pas accès et qu'on ne doit pas afficher le message d'upgrade
  if (!showUpgradePrompt) {
    return null;
  }

  // Afficher un message d'erreur avec un bouton pour mettre à niveau
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isTrialExpired ? 'Votre essai est terminé' : 'Fonctionnalité non incluse'}
        </h3>
        <p className="text-gray-600 mb-6">
          {isTrialExpired
            ? 'Votre période d\'essai est terminée. Passez à un abonnement payant pour continuer à utiliser cette fonctionnalité.'
            : 'Cette fonctionnalité n\'est pas incluse dans votre abonnement actuel.'}
        </p>
        <button
          onClick={() => navigate('/pricing')}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isOnTrial ? 'Choisir un plan' : 'Mettre à niveau'}
        </button>
      </div>
    </div>
  );
};

export default FeatureGuard;
