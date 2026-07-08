import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Page de retour après un paiement Stripe Checkout réussi.
 * Le plan réel est activé côté serveur par l'Edge Function `stripe-webhook`
 * (événement checkout.session.completed) — cette page est purement informative
 * et laisse un court délai pour que le webhook ait le temps de s'exécuter.
 */
const BillingSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSecondsElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
        <CheckCircleIcon className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé</h1>
      <p className="text-gray-600 mb-2">
        Merci ! Votre abonnement est en cours d'activation. Cela ne prend généralement que quelques secondes.
      </p>
      {sessionId && (
        <p className="text-xs text-gray-400 mb-6">Référence de session : {sessionId}</p>
      )}
      {secondsElapsed > 5 && (
        <p className="text-sm text-amber-600 mb-6">
          Si votre plan ne s'est pas encore mis à jour après quelques instants, rafraîchissez la page
          Abonnement — la synchronisation dépend du webhook Stripe configuré côté serveur.
        </p>
      )}
      <Link
        to="/dashboard/billing"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        Retour à mon abonnement
      </Link>
    </div>
  );
};

export default BillingSuccessPage;
