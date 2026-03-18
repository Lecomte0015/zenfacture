import React from 'react';
import { FiClock, FiAlertTriangle } from 'react-icons/fi';
import { useTrial } from '@/hooks/useTrial';

const TrialStatusBadge: React.FC = () => {
  const { isOnTrial, daysRemaining, isTrialExpired, hasActiveSubscription } = useTrial();

  if (hasActiveSubscription) {
    return null; // Ne rien afficher si l'utilisateur a un abonnement actif
  }

  if (isOnTrial) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        <FiClock className="mr-1.5 h-4 w-4" />
        Essai gratuit – {daysRemaining} {daysRemaining > 1 ? 'jours' : 'jour'} restant{daysRemaining > 1 ? 's' : ''}
      </div>
    );
  }

  if (isTrialExpired) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        <FiAlertTriangle className="mr-1.5 h-4 w-4" />
        Essai terminé – Mettez à jour votre abonnement
      </div>
    );
  }

  return null;
};

export default TrialStatusBadge;
