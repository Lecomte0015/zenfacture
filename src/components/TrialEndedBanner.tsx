import React from 'react';
import { useTrial } from '@/hooks/useTrial';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * Bannière affichée lorsque la période d'essai est terminée
 */
const TrialEndedBanner: React.FC = () => {
  const { isTrialExpired, hasActiveSubscription } = useTrial();
  const [isDismissed, setIsDismissed] = React.useState(false);
  const navigate = useNavigate();

  // Ne pas afficher si l'utilisateur a un abonnement actif ou si la période d'essai n'est pas expirée
  if (hasActiveSubscription || !isTrialExpired || isDismissed) {
    return null;
  }

  const handleUpgradeClick = () => {
    navigate('/pricing'); // Rediriger vers la page de tarification
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Optionnel : Enregistrer la préférence utilisateur en base de données
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <FiAlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <div>
            <h3 className="text-sm font-medium text-red-800">Votre essai gratuit est terminé</h3>
            <div className="mt-1 text-sm text-red-700">
              <p>
                Pour continuer à profiter de toutes les fonctionnalités de Zenfacture, veuillez souscrire à un de nos abonnements.
              </p>
            </div>
          </div>
          <div className="mt-4 flex-shrink-0 md:mt-0 md:ml-4">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="text-red-700 bg-white hover:bg-red-100 focus:ring-red-500"
              >
                Plus tard
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleUpgradeClick}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
              >
                Choisir un abonnement
              </Button>
            </div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            type="button"
            className="bg-red-50 rounded-md inline-flex text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={handleDismiss}
          >
            <span className="sr-only">Fermer</span>
            <FiX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialEndedBanner;
