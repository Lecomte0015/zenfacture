import { Link } from 'react-router-dom';
import { 
  FiCode,
  FiPieChart, 
  FiBell, 
  FiMessageSquare, 
  FiSave,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiArrowRight
} from 'react-icons/fi';

const features = [
  {
    name: 'Factures QR-code suisses',
    description: 'Génération de factures QR-code conformes aux normes suisses (SIX Interbank Clearing).',
    icon: FiCode,
    link: 'https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-fr.pdf',
  },
  {
    name: 'Dashboard intelligent',
    description: 'Calcule automatiquement vos charges, bénéfices et prévisions financières en temps réel.',
    icon: FiPieChart,
  },
  {
    name: 'Rappels administratifs',
    description: 'Notifications cliquables avec redirection vers les portails officiels (AVS, TVA, etc.).',
    icon: FiBell,
    link: 'https://www.ahv-iv.ch/fr',
  },
  {
    name: 'Assistant IA',
    description: 'Posez vos questions fiscales et administratives et obtenez des réponses précises.',
    icon: FiMessageSquare,
  },
  {
    name: 'Sauvegarde sécurisée',
    description: 'Stockage de toutes vos factures et dépenses dans un espace personnel sécurisé.',
    icon: FiSave,
  },
  {
    name: 'Gain de temps',
    description: 'Créez et envoyez vos factures en un clic.',
    icon: FiClock,
  },
  {
    name: 'Obligations maîtrisées',
    description: 'Rappels automatiques pour AVS, TVA, impôts.',
    icon: FiCheckCircle,
  },
  {
    name: 'Vision claire',
    description: 'Suivi en temps réel de votre chiffre d\'affaires et bénéfices.',
    icon: FiEye,
  },
];

export const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Toutes les fonctionnalités</span>
              <span className="block text-primary">pour gérer votre entreprise</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
              Découvrez comment ZenFacture peut vous aider à simplifier votre gestion administrative
              et vous faire gagner un temps précieux sur vos tâches quotidiennes.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group relative rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              >
                <div className="absolute inset-0 rounded-xl border-2 border-transparent transition-all duration-200 group-hover:border-primary" aria-hidden="true" />
                <div className="relative h-full flex flex-col">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="ml-4 text-lg font-medium text-gray-900">{feature.name}</h3>
                  </div>
                  <p className="mt-3 text-base text-gray-600 flex-grow">{feature.description}</p>
                  {feature.link && (
                    <a 
                      href={feature.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"
                    >
                      En savoir plus
                      <FiArrowRight className="ml-1 h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Prêt à essayer ZenFacture ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Rejoignez des centaines d'indépendants qui ont simplifié leur gestion administrative.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700"
              >
                Commencer l'essai gratuit
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Voir une démo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
