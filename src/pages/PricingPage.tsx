import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon } from '@heroicons/react/20/solid';
import { Helmet } from 'react-helmet-async';
import SEO from '../components/common/SEO';

const pricingFaqs = [
  {
    question: "Puis-je changer de forfait à tout moment ?",
    answer:
      "Oui, vous pouvez passer d'un forfait à un autre à tout moment. Le changement prendra effet à la fin de votre période de facturation en cours.",
  },
  {
    question: "Quels modes de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les cartes de crédit (Visa, Mastercard, American Express) et les virements bancaires.",
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer:
      "Oui, vous pouvez annuler votre abonnement à tout moment. Vous continuerez à avoir accès aux fonctionnalités jusqu'à la fin de votre période de facturation.",
  },
  {
    question: "Offrez-vous des réductions pour les organisations à but non lucratif ?",
    answer:
      "Oui, nous offrons une réduction de 20% pour les organisations à but non lucratif enregistrées. Contactez notre équipe commerciale pour en savoir plus.",
  },
];

const pricingFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: pricingFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

// Prix mensuels affichés tels quels ; prix "annually" = équivalent mensuel
// une fois l'abonnement annuel payé en une fois (montant réel facturé :
// annualTotal, ex. 15 CHF × 12 = 180 CHF/an pour Essentiel — voir
// stripeService.ts → TARIFS_CHF, qui doit rester synchronisé avec ces valeurs).
const tiers = [
  {
    name: 'Essentiel',
    id: 'essentiel',
    price: { monthly: '19 CHF', annually: '15 CHF' },
    annualTotal: '180 CHF',
    description: 'Parfait pour les indépendants et les petites entreprises',
    features: [
      'Jusqu\'à 10 factures par mois',
      'Suivi des paiements',
      'Modèles personnalisables',
      'Support par email',
    ],
    featured: false,
  },
  {
    name: 'Professionnel',
    id: 'pro',
    price: { monthly: '49 CHF', annually: '39 CHF' },
    annualTotal: '468 CHF',
    description: 'Idéal pour les entreprises en croissance',
    features: [
      'Factures illimitées',
      'Suivi des dépenses',
      'Rapports avancés',
      'Support prioritaire',
      'Intégration comptable',
    ],
    featured: true,
  },
  {
    name: 'Entreprise',
    id: 'entreprise',
    price: { monthly: '99 CHF', annually: '79 CHF' },
    annualTotal: '948 CHF',
    description: 'Pour les entreprises avec des besoins avancés',
    features: [
      'Toutes les fonctionnalités Professionnel',
      'Comptes multi-utilisateurs',
      'API personnalisée',
      'Formation personnalisée',
      'Support 24/7',
    ],
    featured: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const PricingPage = () => {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'annually'>('monthly');
  
  return (
    <>
      <SEO
        title="Tarifs"
        description="Des forfaits simples et transparents en francs suisses pour la facturation QR-facture, les devis et la TVA. 30 jours d'essai gratuit, sans carte bancaire."
        keywords="prix logiciel facturation suisse, tarif facturation PME, abonnement facturation CHF, logiciel devis facture indépendant suisse gratuit"
        url="https://zenfacture.ch/tarifs"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(pricingFaqSchema)}</script>
      </Helmet>
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-24 px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:items-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Un tarif simple, sans mauvaise surprise
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-600">
            Choisissez la formule qui correspond à la taille de votre activité aujourd'hui — vous pourrez toujours en changer demain. Les 30 premiers jours sont gratuits, sans carte bancaire.
          </p>
          
          {/* Billing toggle */}
          <div className="relative mt-6 flex items-center">
            <span className={classNames(
              billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-400',
              'text-sm font-medium'
            )}>
              Mensuel
            </span>
            <button
              type="button"
              className="mx-4 flex h-6 w-11 items-center rounded-full bg-primary-600 p-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
              aria-pressed={billingCycle === 'annually'}
              aria-label="Basculer entre tarification mensuelle et annuelle"
            >
              <span
                className={classNames(
                  billingCycle === 'monthly' ? 'translate-x-1' : 'translate-x-6',
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out'
                )}
              />
            </button>
            <span className={classNames(
              billingCycle === 'annually' ? 'text-gray-900' : 'text-gray-400',
              'text-sm font-medium flex items-center'
            )}>
              Annuel <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Économisez 20%</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-gray-500">Sans engagement · Annulation en un clic, à tout moment</p>
        </div>

        {/* Tiers */}
        <div className="mt-12 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:space-y-0">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.featured
                  ? 'bg-primary-50 border-primary-200 shadow-2xl shadow-primary-200/50'
                  : 'border-gray-200 hover:shadow-card-hover transition-shadow',
                'relative flex flex-col rounded-2xl border p-8 sm:p-9'
              )}
            >
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
                {tier.featured && (
                  <p className="absolute top-0 -translate-y-1/2 transform rounded-full bg-primary-500 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Le plus populaire
                  </p>
                )}
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-bold tracking-tight">
                    {tier.price[billingCycle]}
                  </span>
                  <span className="ml-1 text-xl font-semibold">/mois</span>
                </p>
                {billingCycle === 'annually' && (
                  <p className="mt-1 text-sm text-gray-500">
                    Facturé {tier.annualTotal}/an
                  </p>
                )}
                <p className="mt-6 text-gray-600">{tier.description}</p>

                {/* Feature list */}
                <ul role="list" className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex">
                      <CheckIcon
                        className="h-6 w-6 flex-shrink-0 text-green-500"
                        aria-hidden="true"
                      />
                      <span className="ml-3 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={`/auth/register?plan=${tier.id}&cycle=${billingCycle}`}
                className={classNames(
                  tier.featured
                    ? 'bg-primary-600 text-white hover:bg-primary-700 hover:text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-primary-600 hover:text-white',
                  'mt-8 block w-full rounded-md border border-gray-200 px-6 py-3 text-center font-medium transition-colors duration-200'
                )}
              >
                {tier.featured ? 'Commencer mon essai gratuit' : 'Essayer 30 jours gratuitement'}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Encore des questions ?
          </h2>
          <div className="mt-12">
            <dl className="space-y-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12 md:space-y-0">
              {pricingFaqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="text-lg font-medium leading-6 text-gray-900">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-base text-gray-600">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default PricingPage;
