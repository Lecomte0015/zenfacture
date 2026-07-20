import { Link } from 'react-router-dom';
import type { IconType } from 'react-icons';
import SEO from '../components/common/SEO';
import {
  FiCode,
  FiPieChart,
  FiBell,
  FiMessageSquare,
  FiSave,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiArrowRight,
  FiBookOpen,
  FiShoppingCart,
  FiDollarSign,
  FiUsers,
} from 'react-icons/fi';

interface Feature {
  name: string;
  description: string;
  icon: IconType;
  link?: string;
  internalLink?: string;
}

const features: Feature[] = [
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
    name: 'Comptabilité automatisée',
    description: 'Plan comptable suisse, grand livre, bilan et compte de résultat générés automatiquement depuis vos factures et dépenses.',
    icon: FiBookOpen,
    internalLink: '/fonctionnalites/comptabilite',
  },
  {
    name: 'Gestion des commandes',
    description: 'Suivi des commandes fournisseurs de l\'envoi à la réception des marchandises, relié à votre stock.',
    icon: FiShoppingCart,
    internalLink: '/fonctionnalites/gestion-commandes',
  },
  {
    name: 'Gestion des salaires simplifiée',
    description: 'Calcul automatique des déductions légales suisses (AVS, AC, LPP) et export Swissdec de vos fiches de salaire.',
    icon: FiDollarSign,
    internalLink: '/fonctionnalites/gestion-salaires',
  },
  {
    name: 'Gestion des contacts',
    description: 'Un carnet clients clair et structuré, avec recherche instantanée et historique complet par contact.',
    icon: FiUsers,
    internalLink: '/fonctionnalites/gestion-contacts',
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
    <>
      <SEO
        title="Fonctionnalités"
        description="QR-facture suisse conforme, devis en ligne, calcul automatique de la TVA, rappels administratifs et assistant IA : découvrez toutes les fonctionnalités de ZenFacture."
        keywords="fonctionnalités logiciel facturation suisse, QR-facture, devis en ligne, calcul TVA suisse, rappels AVS, assistant IA facturation"
        url="https://www.zenfacture.ch/fonctionnalites"
      />
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Tout ce qu'il faut</span>
              <span className="block text-primary-600">pour piloter votre entreprise sereinement</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
              De la première facture à la déclaration de TVA, ZenFacture s'occupe de la paperasse
              pour que vous puissiez vous concentrer sur votre métier.
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
                className="group relative rounded-2xl bg-white p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1"
              >
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent transition-all duration-200 group-hover:border-primary-300" aria-hidden="true" />
                <div className="relative h-full flex flex-col">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="ml-4 text-lg font-medium text-gray-900">{feature.name}</h3>
                  </div>
                  <p className="mt-3 text-base text-gray-600 flex-grow">{feature.description}</p>
                  {feature.internalLink && (
                    <Link
                      to={feature.internalLink}
                      className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"
                    >
                      Voir le fonctionnement
                      <FiArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  )}
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
              Prêt à voir ça en action ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Rejoignez les indépendants et PME suisses qui ont déjà simplifié leur facturation.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center rounded-xl border border-primary-600 bg-primary-600 px-6 py-3 text-base font-bold text-white shadow-warm hover:bg-primary-700 transition-all duration-200"
              >
                Commencer l'essai gratuit
              </Link>
              <Link
                to="/aide"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Demander une démo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default FeaturesPage;
