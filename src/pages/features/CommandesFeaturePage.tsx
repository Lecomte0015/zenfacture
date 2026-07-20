import { ShoppingCart, Building, Send, Truck, Package, BarChart3, ShieldCheck, Wallet, Users } from 'lucide-react';
import FeatureLayout from '@/components/features/FeatureLayout';
import { MockupFrame } from '@/components/features/MockupFrame';

const illustration = (
  <MockupFrame label="Commandes fournisseurs">
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Papeterie Rossier SA</p>
            <p className="text-xs text-gray-500">Commande #CF-0042 · 840.–</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Envoyée</span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Distri-Matériaux Sàrl</p>
            <p className="text-xs text-gray-500">Commande #CF-0041 · 2 350.–</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">En transit</span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Fournitures Léman</p>
            <p className="text-xs text-gray-500">Commande #CF-0039 · 510.–</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Reçue</span>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100">
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900">12</p>
        <p className="text-[11px] text-gray-500">Fournisseurs</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900">3</p>
        <p className="text-[11px] text-gray-500">En attente</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900">8 240.–</p>
        <p className="text-[11px] text-gray-500">Achats du mois</p>
      </div>
    </div>
  </MockupFrame>
);

const steps = [
  {
    icon: <Building className="w-4 h-4" />,
    title: 'Créez vos fiches fournisseurs',
    description: "Enregistrez vos fournisseurs une fois (coordonnées, conditions) et réutilisez-les pour toutes vos commandes à venir.",
  },
  {
    icon: <ShoppingCart className="w-4 h-4" />,
    title: 'Composez votre commande',
    description: "Ajoutez les produits, quantités et prix ligne par ligne. Le total se calcule automatiquement.",
  },
  {
    icon: <Send className="w-4 h-4" />,
    title: 'Envoyez la commande directement depuis l\'app',
    description: "Le fournisseur reçoit le bon de commande par email, sans jongler entre plusieurs outils.",
  },
  {
    icon: <Truck className="w-4 h-4" />,
    title: 'Suivez le statut jusqu\'à réception',
    description: "Brouillon, envoyée, en transit, reçue : suivez chaque commande en un coup d'œil et enregistrez la réception des marchandises.",
  },
];

const benefits = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Vision claire des achats',
    description: 'Statistiques en temps réel : nombre de fournisseurs, commandes en attente, montant des achats du mois.',
  },
  {
    icon: <Package className="w-5 h-5" />,
    title: 'Lien direct avec le stock',
    description: 'La réception d\'une commande met à jour vos niveaux de stock automatiquement.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Traçabilité complète',
    description: 'Historique de chaque commande, de l\'envoi à la réception, consultable à tout moment.',
  },
  {
    icon: <Building className="w-5 h-5" />,
    title: 'Fournisseurs centralisés',
    description: 'Toutes vos relations fournisseurs regroupées, sans tableur ni carnet séparé.',
  },
];

const faqs = [
  {
    question: 'Puis-je gérer plusieurs fournisseurs en parallèle ?',
    answer: "Oui, le nombre de fournisseurs et de commandes n'est pas limité. Chaque fournisseur dispose de sa propre fiche et de son historique de commandes.",
  },
  {
    question: 'Le stock est-il mis à jour automatiquement à la réception ?',
    answer: "Oui. Lorsque vous confirmez la réception d'une commande, les quantités reçues sont automatiquement ajoutées à votre module de stock.",
  },
  {
    question: 'Puis-je annuler ou modifier une commande envoyée ?',
    answer: "Oui, une commande peut être annulée tant qu'elle n'a pas été réceptionnée. L'historique conserve la trace de l'annulation.",
  },
];

const related = [
  {
    title: 'Comptabilité automatisée',
    description: 'Vos achats et factures génèrent automatiquement vos écritures comptables.',
    href: '/fonctionnalites/comptabilite',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    title: 'Gestion des salaires',
    description: 'Calcul automatique des fiches de salaire suisses et export Swissdec.',
    href: '/fonctionnalites/gestion-salaires',
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    title: 'Gestion des contacts',
    description: 'Un carnet clients clair et structuré, avec historique complet.',
    href: '/fonctionnalites/gestion-contacts',
    icon: <Users className="w-5 h-5" />,
  },
];

export const CommandesFeaturePage = () => (
  <FeatureLayout
    seoTitle="Gestion des commandes fournisseurs pour PME suisses"
    seoDescription="Gérez vos commandes fournisseurs de bout en bout : bons de commande, envoi automatique, suivi de statut et réception des marchandises reliée au stock."
    seoKeywords="gestion commandes fournisseurs, logiciel achats PME suisse, suivi commandes fournisseurs en ligne, bon de commande fournisseur, gestion des achats entreprise"
    path="/fonctionnalites/gestion-commandes"
    eyebrow="Achats & commandes"
    title="Gestion des commandes"
    subtitle="Suivez vos commandes fournisseurs de l'envoi à la réception des marchandises : fournisseurs centralisés, statuts en temps réel, mise à jour automatique du stock."
    illustration={illustration}
    steps={steps}
    benefits={benefits}
    faqs={faqs}
    related={related}
  />
);

export default CommandesFeaturePage;
