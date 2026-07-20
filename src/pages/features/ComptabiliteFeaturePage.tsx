import { BookOpen, FileBarChart, TrendingUp, ShieldCheck, Calculator, Landmark, Wallet, ShoppingCart, Users } from 'lucide-react';
import FeatureLayout from '@/components/features/FeatureLayout';
import { MockupFrame } from '@/components/features/MockupFrame';

const illustration = (
  <MockupFrame label="Bilan — 31.12.2026">
    <div className="grid grid-cols-2 gap-4 mb-5">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Actif</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Trésorerie</span>
            <span className="font-medium text-gray-900">24 800.–</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Débiteurs</span>
            <span className="font-medium text-gray-900">6 200.–</span>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Passif</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Créanciers</span>
            <span className="font-medium text-gray-900">3 100.–</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Fonds propres</span>
            <span className="font-medium text-gray-900">27 900.–</span>
          </div>
        </div>
      </div>
    </div>
    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex mb-4">
      <div className="h-full bg-primary-600" style={{ width: '78%' }} />
      <div className="h-full bg-primary-300" style={{ width: '22%' }} />
    </div>
    <div className="border-t border-gray-100 pt-4 space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Dernières écritures</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">12.12 — Facture #2026-0148</span>
        <span className="font-medium text-primary-600">+1 250.–</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">10.12 — Loyer bureau</span>
        <span className="font-medium text-gray-700">-1 800.–</span>
      </div>
    </div>
  </MockupFrame>
);

const steps = [
  {
    icon: <FileBarChart className="w-4 h-4" />,
    title: 'Vos factures et dépenses alimentent le journal automatiquement',
    description: "Chaque facture émise, encaissée ou dépense enregistrée génère automatiquement l'écriture comptable correspondante dans le plan comptable — aucune double saisie.",
  },
  {
    icon: <BookOpen className="w-4 h-4" />,
    title: 'Un plan comptable suisse prêt à l\'emploi',
    description: 'Comptes normalisés (charges, produits, actifs, passifs) conformes aux pratiques suisses, personnalisables selon votre secteur d\'activité.',
  },
  {
    icon: <Calculator className="w-4 h-4" />,
    title: 'Consultez le grand livre par compte et par période',
    description: 'Filtrez par compte, par date de début et de fin, et exportez les mouvements pour vérification ou transmission.',
  },
  {
    icon: <Landmark className="w-4 h-4" />,
    title: 'Bilan et compte de résultat en un clic',
    description: 'Générez votre bilan et votre compte de résultat à la date de votre choix, prêts à être transmis à votre fiduciaire ou à l\'administration fiscale.',
  },
];

const benefits = [
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Zéro double saisie',
    description: 'Les écritures se génèrent depuis vos factures et dépenses existantes, sans ressaisie manuelle.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Conforme aux normes suisses',
    description: 'Plan comptable et présentation du bilan alignés sur les usages comptables suisses.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Pensé pour votre fiduciaire',
    description: 'Exports clairs (grand livre, bilan, compte de résultat) que votre fiduciaire peut exploiter directement.',
  },
  {
    icon: <Wallet className="w-5 h-5" />,
    title: 'Vision financière en temps réel',
    description: "Suivez l'évolution de votre trésorerie, de vos charges et de vos bénéfices sans attendre la fin du mois.",
  },
];

const faqs = [
  {
    question: 'Dois-je avoir des connaissances comptables pour utiliser ce module ?',
    answer: "Non. Le plan comptable est préconfiguré et les écritures se génèrent automatiquement depuis vos factures et dépenses. Une notion de base suffit pour consulter le grand livre, le bilan et le compte de résultat.",
  },
  {
    question: 'Puis-je transmettre ces documents à mon fiduciaire ?',
    answer: "Oui. Le grand livre, le bilan et le compte de résultat s'exportent dans un format lisible et structuré, directement exploitable par votre fiduciaire pour la clôture annuelle ou la déclaration fiscale.",
  },
  {
    question: 'La comptabilité automatisée est-elle incluse dans tous les forfaits ?',
    answer: "Le module de comptabilité est disponible à partir du forfait Professionnel. Consultez la page Tarifs pour comparer les forfaits Essentiel, Professionnel et Entreprise.",
  },
];

const related = [
  {
    title: 'Gestion des salaires',
    description: 'Calcul automatique des fiches de salaire suisses et export Swissdec.',
    href: '/fonctionnalites/gestion-salaires',
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    title: 'Gestion des commandes fournisseurs',
    description: 'Suivi des achats de l\'envoi de la commande à la réception des marchandises.',
    href: '/fonctionnalites/gestion-commandes',
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  {
    title: 'Gestion des contacts',
    description: 'Un carnet clients clair et structuré, avec historique complet.',
    href: '/fonctionnalites/gestion-contacts',
    icon: <Users className="w-5 h-5" />,
  },
];

export const ComptabiliteFeaturePage = () => (
  <FeatureLayout
    seoTitle="Comptabilité automatisée pour PME suisses"
    seoDescription="Comptabilité automatisée pour indépendants et PME suisses : plan comptable prêt à l'emploi, grand livre, bilan et compte de résultat générés automatiquement depuis vos factures."
    seoKeywords="comptabilité automatisée suisse, logiciel comptabilité PME suisse, plan comptable suisse en ligne, bilan compte de résultat automatique, comptabilité indépendant suisse, grand livre en ligne"
    path="/fonctionnalites/comptabilite"
    eyebrow="Comptabilité"
    title="Comptabilité automatisée"
    subtitle="Vos factures et dépenses génèrent automatiquement vos écritures comptables. Plan comptable suisse, grand livre, bilan et compte de résultat, sans double saisie."
    illustration={illustration}
    steps={steps}
    benefits={benefits}
    faqs={faqs}
    related={related}
  />
);

export default ComptabiliteFeaturePage;
