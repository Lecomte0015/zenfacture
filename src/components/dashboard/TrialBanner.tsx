import { Link } from 'react-router-dom';
import { Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { useTrial } from '@/hooks/useTrial';

/**
 * Bandeau persistant informant l'utilisateur de sa période d'essai gratuite :
 * nombre de jours restants (ou expiration), avec un appel à l'action clair
 * vers la page d'abonnement. Objectif : inciter à la conversion avant la fin
 * de l'essai plutôt que de laisser l'utilisateur découvrir la coupure d'accès
 * sans prévenir.
 *
 * - Essai actif, plus de 3 jours restants : bandeau bleu, ton informatif.
 * - Essai actif, 3 jours ou moins : bandeau orange, ton plus urgent.
 * - Essai expiré : bandeau rouge, incite à choisir un forfait immédiatement.
 * - Abonnement payant actif ou pas d'essai en cours : rien n'est affiché.
 */
export const TrialBanner = () => {
  const { isOnTrial, isTrialExpired, daysRemaining, hasActiveSubscription, formattedTrialEndDate } = useTrial();

  if (hasActiveSubscription) return null;
  if (!isOnTrial && !isTrialExpired) return null;

  if (isTrialExpired) {
    return (
      <div className="shrink-0 bg-red-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Votre période d'essai gratuit est terminée. Choisissez un forfait pour continuer à utiliser ZenFacture.</span>
        </div>
        <Link
          to="/dashboard/billing"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-700 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Choisir un forfait
        </Link>
      </div>
    );
  }

  const urgent = daysRemaining <= 3;

  return (
    <div
      className={`shrink-0 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap ${
        urgent ? 'bg-orange-500 text-white' : 'bg-blue-50 text-blue-900 border-b border-blue-100'
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>
          {daysRemaining === 0
            ? "Votre essai gratuit se termine aujourd'hui."
            : daysRemaining === 1
            ? 'Il vous reste 1 jour d\'essai gratuit.'
            : `Il vous reste ${daysRemaining} jours d'essai gratuit.`}
          {formattedTrialEndDate && (
            <span className={urgent ? 'font-normal' : 'font-normal text-blue-700'}> (fin le {formattedTrialEndDate})</span>
          )}
        </span>
      </div>
      <Link
        to="/dashboard/billing"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors flex-shrink-0 ${
          urgent
            ? 'bg-white text-orange-600 hover:bg-orange-50'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Choisir un forfait
      </Link>
    </div>
  );
};

export default TrialBanner;
