import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, ArrowRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import useSubscriptionFeatures, { PlanAbonnement } from '../hooks/useSubscriptionFeatures';

const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    plan: currentPlan, 
    nomCompletPlan, 
    fonctionnalites, 
    mettreAJourPlan, 
    loading: loadingPlan 
  } = useSubscriptionFeatures();
  
  const [selectedPlan, setSelectedPlan] = useState<PlanAbonnement | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const plans = [
    {
      id: 'essentiel',
      name: 'Essentiel',
      price: 'Gratuit',
      description: 'Parfait pour les indépendants et petites entreprises',
      features: [
        'Jusqu\'à 10 factures/mois',
        'Jusqu\'à 5 clients',
        'Support de base',
        'Paiements en ligne',
        'Modèles de factures personnalisables'
      ],
      cta: 'Plan actuel',
      featured: currentPlan === 'essentiel',
      disabled: false
    },
    {
      id: 'pro',
      name: 'Professionnel',
      price: '19€',
      description: 'Pour les professionnels qui ont besoin de plus de flexibilité',
      features: [
        'Factures illimitées',
        'Clients illimités',
        'Support prioritaire',
        'Facturation récurrente',
        'Rappels automatiques',
        'Export des données',
        'Suivi des dépenses',
        'Rapports avancés'
      ],
      cta: currentPlan === 'pro' ? 'Plan actuel' : 'Passer au professionnel',
      featured: currentPlan === 'pro',
      disabled: false
    },
    {
      id: 'entreprise',
      name: 'Entreprise',
      price: '49€',
      description: 'Pour les entreprises avec des besoins avancés',
      features: [
        'Toutes les fonctionnalités Pro',
        'Gestion d\'équipe',
        'Accès API complet',
        'Support 24/7',
        'Intégrations personnalisées',
        'Formation dédiée',
        'Contrat personnalisé',
        'Migration des données'
      ],
      cta: currentPlan === 'entreprise' ? 'Plan actuel' : 'Choisir l\'entreprise',
      featured: currentPlan === 'entreprise',
      disabled: false
    }
  ];

  const handlePlanChange = async (newPlan: PlanAbonnement) => {
    if (newPlan === currentPlan) return;
    
    setSelectedPlan(newPlan);
    
    // Si c'est une rétrogradation, demander confirmation
    if (
      (currentPlan === 'entreprise' && (newPlan === 'pro' || newPlan === 'essentiel')) ||
      (currentPlan === 'pro' && newPlan === 'essentiel')
    ) {
      setIsChangingPlan(true);
      return;
    }
    
    // Si c'est une mise à niveau, procéder directement
    await updatePlan(newPlan);
  };
  
  const confirmPlanChange = async () => {
    if (!selectedPlan) return;
    await updatePlan(selectedPlan);
    setIsChangingPlan(false);
    setSelectedPlan(null);
  };
  
  const updatePlan = async (newPlan: PlanAbonnement) => {
    try {
      setError(null);
      setSuccess(null);
      
      // En production, vous devrez intégrer avec votre système de paiement ici
      // Pour l'instant, nous allons simplement mettre à jour le plan dans la base de données
      
      const success = await mettreAJourPlan(newPlan);
      
      if (success) {
        setSuccess(`Votre abonnement a été mis à jour vers le plan ${newPlan}.`);
      } else {
        setError('Une erreur est survenue lors de la mise à jour de votre abonnement.');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du plan:', err);
      setError('Une erreur est survenue. Veuillez réessayer plus tard.');
    }
  };

  // Fonction pour formater la date d'essai gratuit
  const getDateFinEssai = () => {
    if (!user?.created_at) return null;
    
    const dateCreation = new Date(user.created_at);
    dateCreation.setDate(dateCreation.getDate() + 30); // Essai de 30 jours
    
    return dateCreation.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Abonnement et facturation</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gérez votre abonnement et consultez l'historique de facturation
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bannière d'essai gratuit */}
      {currentPlan === 'essentiel' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Vous profitez actuellement d'un essai gratuit de 30 jours. Votre essai se termine le {getDateFinEssai()}.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Votre abonnement actuel
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Gérez votre plan et consultez les détails de facturation
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                Plan {nomCompletPlan}
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                {currentPlan === 'essentiel' 
                  ? 'Accès aux fonctionnalités de base de ZenFacture.'
                  : currentPlan === 'pro'
                    ? 'Accès aux fonctionnalités avancées pour les professionnels.'
                    : 'Accès complet à toutes les fonctionnalités pour les entreprises.'
                }
              </p>
              {currentPlan !== 'essentiel' && (
                <p className="mt-2 text-sm text-gray-600">
                  Prochain prélèvement: Le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  // Rediriger vers la section des plans
                  document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Changer de plan
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Fonctionnalités incluses
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Factures illimitées</h5>
                  <p className="text-sm text-gray-500">Créez et envoyez un nombre illimité de factures</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckIcon className={`h-5 w-5 ${fonctionnalites.facturationAvancee ? 'text-green-500' : 'text-gray-300'} mr-2 mt-0.5 flex-shrink-0`} />
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Facturation récurrente</h5>
                  <p className="text-sm text-gray-500">Automatisez vos factures récurrentes</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckIcon className={`h-5 w-5 ${fonctionnalites.multiUtilisateurs ? 'text-green-500' : 'text-gray-300'} mr-2 mt-0.5 flex-shrink-0`} />
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Équipe</h5>
                  <p className="text-sm text-gray-500">Ajoutez des membres à votre équipe</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckIcon className={`h-5 w-5 ${fonctionnalites.api ? 'text-green-500' : 'text-gray-300'} mr-2 mt-0.5 flex-shrink-0`} />
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Accès API</h5>
                  <p className="text-sm text-gray-500">Intégrez avec vos propres outils</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckIcon className={`h-5 w-5 ${fonctionnalites.support24_7 ? 'text-green-500' : fonctionnalites.supportPrioritaire ? 'text-green-500' : 'text-gray-300'} mr-2 mt-0.5 flex-shrink-0`} />
                <div>
                  <h5 className="text-sm font-medium text-gray-900">
                    {fonctionnalites.support24_7 ? 'Support 24/7' : fonctionnalites.supportPrioritaire ? 'Support prioritaire' : 'Support de base'}
                  </h5>
                  <p className="text-sm text-gray-500">
                    {fonctionnalites.support24_7 
                      ? 'Assistance technique disponible 24h/24, 7j/7' 
                      : fonctionnalites.supportPrioritaire 
                        ? 'Réponse sous 4 heures ouvrées' 
                        : 'Réponse sous 24h ouvrées'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckIcon className={`h-5 w-5 ${fonctionnalites.exportDonnees ? 'text-green-500' : 'text-gray-300'} mr-2 mt-0.5 flex-shrink-0`} />
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Export des données</h5>
                  <p className="text-sm text-gray-500">Exportez vos données à tout moment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="plans" className="mt-16 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Choisissez le plan qui vous convient</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          Sélectionnez le forfait qui correspond le mieux à vos besoins. Vous pouvez changer de plan à tout moment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 ${
                plan.featured ? 'border-blue-500' : 'border-gray-200'
              } bg-white p-6 shadow-sm flex flex-col`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Plan actuel
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                
                <div className="mt-4">
                  <p className="text-4xl font-extrabold text-gray-900">
                    {plan.price}
                    {plan.id !== 'essentiel' && (
                      <span className="text-base font-medium text-gray-500">/mois</span>
                    )}
                  </p>
                  {plan.id !== 'essentiel' && (
                    <p className="mt-1 text-sm text-gray-500">Facturé mensuellement</p>
                  )}
                </div>
                
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8">
                <button
                  type="button"
                  className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                    plan.featured
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  onClick={() => handlePlanChange(plan.id as PlanAbonnement)}
                  disabled={plan.id === currentPlan || isChangingPlan}
                >
                  {plan.id === currentPlan ? 'Plan actuel' : `Choisir ${plan.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Questions fréquentes</h2>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl className="space-y-6 divide-y divide-gray-200">
              {[
                {
                  question: "Puis-je changer de plan à tout moment ?",
                  answer: "Oui, vous pouvez passer d'un plan à un autre à tout moment. Le changement prendra effet immédiatement et vous serez facturé au prorata pour le reste de la période de facturation en cours."
                },
                {
                  question: "Y a-t-il des frais cachés ?",
                  answer: "Non, les prix affichés sont tout compris. Les taxes applicables seront calculées lors du paiement en fonction de votre pays de résidence."
                },
                {
                  question: "Puis-je annuler mon abonnement à tout moment ?",
                  answer: "Oui, vous pouvez annuler votre abonnement à tout moment. Vous conserverez l'accès aux fonctionnalités payantes jusqu'à la fin de votre période de facturation en cours."
                },
                {
                  question: "Quels modes de paiement acceptez-vous ?",
                  answer: "Nous acceptons les cartes de crédit (Visa, Mastercard, American Express) et les virements bancaires pour les plans Entreprise."
                },
                {
                  question: "Proposez-vous une réduction pour les associations ou les ONG ?",
                  answer: "Oui, nous offrons des réductions pour les associations à but non lucratif et les ONG. Veuillez nous contacter à support@zenfacture.com pour plus d'informations."
                }
              ].map((item, index) => (
                <div key={index} className="pt-6">
                  <dt className="text-lg">
                    <button className="text-left w-full flex justify-between items-start text-gray-700">
                      <span className="font-medium">{item.question}</span>
                      <span className="ml-6 h-7 flex items-center">
                        <svg className="h-6 w-6 transform rotate-0 group-hover:rotate-180 transition" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>
                  </dt>
                  <dd className="mt-2 pr-12">
                    <p className="text-base text-gray-600">{item.answer}</p>
                  </dd>
                </div>
              ))}
            </dl>
            
            <div className="mt-8 text-center">
              <p className="text-base text-gray-500">
                Vous avez d'autres questions ?{' '}
                <a href="mailto:support@zenfacture.com" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Contactez notre équipe
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation de changement de plan */}
      {isChangingPlan && selectedPlan && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                  <ExclamationCircleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Confirmer le changement de plan
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Vous êtes sur le point de passer du plan <span className="font-medium">{nomCompletPlan}</span> au plan <span className="font-medium">{
                        selectedPlan === 'essentiel' ? 'Essentiel' : 
                        selectedPlan === 'pro' ? 'Professionnel' : 'Entreprise'
                      }</span>.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      {selectedPlan === 'essentiel' ? (
                        'Vos données seront conservées, mais certaines fonctionnalités ne seront plus accessibles.'
                      ) : (
                        'Votre carte sera débitée du montant correspondant au prorata de votre période de facturation en cours.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  onClick={confirmPlanChange}
                  disabled={loadingPlan}
                >
                  {loadingPlan ? 'Traitement...' : 'Confirmer'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setIsChangingPlan(false);
                    setSelectedPlan(null);
                  }}
                  disabled={loadingPlan}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
