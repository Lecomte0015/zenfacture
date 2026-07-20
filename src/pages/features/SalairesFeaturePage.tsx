import { Users, FileText, ShieldCheck, Download, CheckCircle2, ShoppingCart, BarChart3 } from 'lucide-react';
import FeatureLayout from '@/components/features/FeatureLayout';
import { MockupFrame } from '@/components/features/MockupFrame';

const illustration = (
  <MockupFrame label="Fiche de salaire — décembre 2026">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">Amélie Kunz</p>
        <p className="text-xs text-gray-500">CDI · Taux d'activité 100%</p>
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" /> Payé
      </span>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Salaire brut</span>
        <span className="font-medium text-gray-900">6 200.–</span>
      </div>
      <div className="flex items-center justify-between text-gray-500">
        <span>AVS / AI / APG</span>
        <span>-322.40</span>
      </div>
      <div className="flex items-center justify-between text-gray-500">
        <span>Assurance chômage (AC)</span>
        <span>-68.20</span>
      </div>
      <div className="flex items-center justify-between text-gray-500">
        <span>LPP</span>
        <span>-310.00</span>
      </div>
      <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
        <span className="font-semibold text-gray-900">Salaire net</span>
        <span className="font-bold text-primary-600">5 499.40</span>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100 text-center">
      <div>
        <p className="text-lg font-bold text-gray-900">6</p>
        <p className="text-[11px] text-gray-500">Employés</p>
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">6</p>
        <p className="text-[11px] text-gray-500">Fiches validées</p>
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">XML</p>
        <p className="text-[11px] text-gray-500">Export Swissdec</p>
      </div>
    </div>
  </MockupFrame>
);

const steps = [
  {
    icon: <Users className="w-4 h-4" />,
    title: 'Ajoutez vos employés',
    description: "Contrat (CDI, CDD, stage, apprentissage), taux d'activité, salaire brut mensuel et coordonnées AVS enregistrés une fois pour toutes.",
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    title: 'Les déductions légales suisses sont calculées automatiquement',
    description: "AVS/AI/APG, assurance chômage (AC), LPP et primes d'assurance accident sont appliquées selon les taux légaux en vigueur.",
  },
  {
    icon: <FileText className="w-4 h-4" />,
    title: 'Générez et validez la fiche de salaire mensuelle',
    description: "Chaque fiche passe de brouillon à validée puis payée, avec un historique complet par employé.",
  },
  {
    icon: <Download className="w-4 h-4" />,
    title: 'Exportez au format Swissdec XML ou CSV',
    description: "Transmettez directement les fiches à votre caisse de compensation, votre assurance ou votre fiduciaire.",
  },
];

const benefits = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Taux légaux suisses à jour',
    description: 'Les calculs AVS, AC et LPP suivent les taux légaux en vigueur, sans mise à jour manuelle de votre part.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Tous vos employés au même endroit',
    description: 'Contrats, taux d\'activité et historique de paie centralisés, quel que soit le nombre d\'employés.',
  },
  {
    icon: <Download className="w-5 h-5" />,
    title: 'Export Swissdec compatible',
    description: 'Vos fiches de salaire s\'exportent dans un format directement utilisable par les caisses de compensation.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Statuts clairs',
    description: 'Brouillon, validé, payé : sachez toujours où en est chaque fiche de salaire du mois.',
  },
];

const faqs = [
  {
    question: 'Les taux AVS, AC et LPP sont-ils tenus à jour ?',
    answer: "Oui, les taux légaux utilisés pour les calculs de déductions suivent la réglementation suisse en vigueur.",
  },
  {
    question: 'Puis-je exporter les fiches de salaire pour ma fiduciaire ou ma caisse de compensation ?',
    answer: "Oui, deux formats d'export sont disponibles : Swissdec XML (standard suisse pour l'échange de données salariales) et CSV.",
  },
  {
    question: 'Combien d\'employés puis-je gérer avec ce module ?',
    answer: "Le nombre d'employés gérés dépend de votre forfait. Consultez la page Tarifs pour comparer les limites des forfaits Essentiel, Professionnel et Entreprise.",
  },
];

const related = [
  {
    title: 'Comptabilité automatisée',
    description: 'Plan comptable, grand livre, bilan et compte de résultat générés automatiquement.',
    href: '/fonctionnalites/comptabilite',
    icon: <BarChart3 className="w-5 h-5" />,
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

export const SalairesFeaturePage = () => (
  <FeatureLayout
    seoTitle="Gestion des salaires simplifiée pour petites entreprises suisses"
    seoDescription="Logiciel de paie suisse pour PME : calcul automatique des déductions légales (AVS, AC, LPP), fiches de salaire et export Swissdec XML pour votre fiduciaire."
    seoKeywords="logiciel paie suisse, gestion salaires PME, fiche de salaire suisse en ligne, calcul AVS LPP salaire, logiciel RH indépendant suisse, export swissdec"
    path="/fonctionnalites/gestion-salaires"
    eyebrow="Ressources humaines"
    title="Gestion des salaires simplifiée"
    subtitle="Ajoutez vos employés, ZenFacture calcule automatiquement les déductions légales suisses et génère vos fiches de salaire, prêtes à exporter au format Swissdec."
    illustration={illustration}
    steps={steps}
    benefits={benefits}
    faqs={faqs}
    related={related}
  />
);

export default SalairesFeaturePage;
