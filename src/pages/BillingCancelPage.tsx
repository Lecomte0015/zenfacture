import React from 'react';
import { Link } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/outline';

/**
 * Page de retour lorsque l'utilisateur annule le paiement Stripe Checkout
 * (bouton retour de Stripe, ou fermeture de l'onglet). Aucun changement de
 * plan n'a eu lieu : le profil reste sur son plan précédent.
 */
const BillingCancelPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
        <XCircleIcon className="h-10 w-10 text-gray-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement annulé</h1>
      <p className="text-gray-600 mb-6">
        Vous avez annulé le paiement. Aucun montant n'a été débité et votre abonnement n'a pas changé.
      </p>
      <Link
        to="/dashboard/billing"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        Retour aux plans
      </Link>
    </div>
  );
};

export default BillingCancelPage;
