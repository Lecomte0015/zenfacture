import { Users, Search, History, Download, FileText, ShieldCheck, Wallet, ShoppingCart, BarChart3 } from 'lucide-react';
import FeatureLayout from '@/components/features/FeatureLayout';
import { MockupFrame } from '@/components/features/MockupFrame';

const illustration = (
  <MockupFrame label="Contacts">
    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
      <Search className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-400">Rechercher un contact…</span>
    </div>
    <div className="space-y-2.5">
      <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
            MD
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Marc Dupasquier</p>
            <p className="text-xs text-gray-500">Dupasquier Rénovation Sàrl</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Client</span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
            SL
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Sophie Loretan</p>
            <p className="text-xs text-gray-500">Cabinet Loretan Avocats</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Client</span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
            TK
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Thierry Keller</p>
            <p className="text-xs text-gray-500">Keller Architecture</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Prospect</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-gray-100 text-center">
      <div>
        <p className="text-lg font-bold text-gray-900">47</p>
        <p className="text-[11px] text-gray-500">Contacts enregistrés</p>
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">CSV</p>
        <p className="text-[11px] text-gray-500">Export en un clic</p>
      </div>
    </div>
  </MockupFrame>
);

const steps = [
  {
    icon: <Users className="w-4 h-4" />,
    title: 'Ajoutez vos contacts',
    description: "Particuliers ou entreprises, avec coordonnées complètes, devise préférée et conditions de paiement mémorisées pour chaque contact.",
  },
  {
    icon: <Search className="w-4 h-4" />,
    title: 'Retrouvez-les instantanément',
    description: "Recherche en temps réel par nom, entreprise ou email : plus besoin de faire défiler un long tableur.",
  },
  {
    icon: <History className="w-4 h-4" />,
    title: 'Consultez l\'historique complet par contact',
    description: "Factures, devis et paiements liés à chaque contact sont accessibles depuis sa fiche, sans changer de page.",
  },
  {
    icon: <Download className="w-4 h-4" />,
    title: 'Exportez votre carnet de contacts',
    description: "Export CSV complet pour sauvegarde, migration ou usage dans un autre outil.",
  },
];

const benefits = [
  {
    icon: <Search className="w-5 h-5" />,
    title: 'Recherche instantanée',
    description: 'Retrouvez n\'importe quel contact en quelques lettres, quel que soit le nombre de fiches enregistrées.',
  },
  {
    icon: <History className="w-5 h-5" />,
    title: 'Historique centralisé',
    description: 'Toutes les factures, tous les devis et tous les paiements d\'un contact regroupés sur une seule fiche.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Conditions mémorisées',
    description: 'Devise préférée et conditions de paiement enregistrées une fois, appliquées automatiquement à chaque nouveau document.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Données sécurisées',
    description: 'Vos contacts sont hébergés en Suisse et protégés conformément à la nLPD.',
  },
];

const faqs = [
  {
    question: 'Combien de contacts puis-je enregistrer avec le forfait Essentiel ?',
    answer: "Le forfait Essentiel permet d'enregistrer jusqu'à 20 contacts. Les forfaits Professionnel et Entreprise offrent un nombre de contacts illimité.",
  },
  {
    question: 'Puis-je exporter mes contacts ?',
    answer: "Oui, l'export CSV de votre carnet de contacts est disponible sur les forfaits Professionnel et Entreprise.",
  },
  {
    question: 'Puis-je voir l\'historique des factures d\'un contact précis ?',
    answer: "Oui, chaque fiche contact centralise l'historique complet des factures, devis et paiements associés à ce contact.",
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
];

export const ContactsFeaturePage = () => (
  <FeatureLayout
    seoTitle="Gestion des contacts clients claire et structurée"
    seoDescription="Gérez vos contacts clients simplement : recherche instantanée, historique complet des factures et devis par contact, export CSV. Pensé pour les PME suisses."
    seoKeywords="gestion clients logiciel suisse, CRM PME suisse, carnet de contacts facturation, fiche client en ligne, logiciel gestion contacts indépendant"
    path="/fonctionnalites/gestion-contacts"
    eyebrow="Clients"
    title="Gestion des contacts claire et structurée"
    subtitle="Un carnet de contacts centralisé : recherche instantanée, historique complet des factures et devis par contact, conditions de paiement mémorisées."
    illustration={illustration}
    steps={steps}
    benefits={benefits}
    faqs={faqs}
    related={related}
  />
);

export default ContactsFeaturePage;
