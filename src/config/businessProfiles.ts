// ─────────────────────────────────────────────────────────────────────────────
// Business Profiles — ZenFacture
// Chaque profil définit :
//   • les groupes/items de sidebar visibles
//   • les actions rapides affichées sur le dashboard
// ─────────────────────────────────────────────────────────────────────────────

export type ProfilMetier =
  | 'commerce'
  | 'services'
  | 'freelance'
  | 'restauration'
  | 'construction'
  | 'sante'
  | 'pme';

export interface QuickAction {
  label: string;
  href: string;
  emoji: string;
  color: string; // Tailwind bg class
  textColor: string;
}

export interface ProfileFeatures {
  // ── Facturation ──────────────────────────────────────────
  /** Catalogue produits (faux pour les métiers de service) */
  produits: boolean;
  /** Devis (faux pour restauration, commerce B2C) */
  devis: boolean;
  /** Facturations récurrentes */
  recurrences: boolean;
  /** Facturation groupée */
  batch: boolean;
  /** Signatures électroniques */
  signatures: boolean;
  // ── Stock & vente ─────────────────────────────────────────
  /** Gestion de stock */
  stock: boolean;
  /** Point de vente */
  pos: boolean;
  /** Boutiques en ligne */
  boutique: boolean;
  /** Portail client */
  portailClient: boolean;
  /** CRM Pipeline */
  crm: boolean;
  // ── Achats ────────────────────────────────────────────────
  /** Commandes fournisseurs */
  commandes: boolean;
  // ── Administration ────────────────────────────────────────
  /** Suivi du temps */
  timeTracking: boolean;
  /** Gestion salaires / paie */
  payroll: boolean;
  /** Multi-marques */
  marques: boolean;
  // ── Finance & rapports ────────────────────────────────────
  /** Détection fraude */
  fraud: boolean;
  /** Audit Trail */
  audit: boolean;
  /** Envoi postal */
  postal: boolean;
  /** Estimation fiscale */
  taxEstimation: boolean;
}

export interface BusinessProfile {
  id: ProfilMetier;
  label: string;
  emoji: string;
  description: string;
  /** Couleur Tailwind principale (sans le `bg-` ou `text-`) */
  accentColor: string;
  features: ProfileFeatures;
  quickActions: QuickAction[];
}

// ─── Profils ────────────────────────────────────────────────────────────────

export const BUSINESS_PROFILES: Record<ProfilMetier, BusinessProfile> = {

  // ── Commerce / Boutique ──────────────────────────────────────────────────
  // Vente B2C directe : POS + stock + boutique. Pas de CRM ni devis.
  commerce: {
    id: 'commerce',
    label: 'Commerce / Boutique',
    emoji: '🛍️',
    description: 'Vente au détail, boutique physique ou en ligne',
    accentColor: 'blue',
    features: {
      produits: true,  devis: false,  recurrences: false, batch: false,  signatures: false,
      stock: true,     pos: true,     boutique: true,     portailClient: false, crm: false,
      commandes: true,
      timeTracking: false, payroll: true,  marques: true,
      fraud: false, audit: false, postal: false, taxEstimation: true,
    },
    quickActions: [
      { label: 'Caisse POS',       href: '/dashboard/pos',                   emoji: '🏪', color: 'bg-blue-600',    textColor: 'text-white' },
      { label: 'Stock',            href: '/dashboard/stock',                  emoji: '📦', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'Fournisseurs',     href: '/dashboard/commandes-fournisseurs', emoji: '🚚', color: 'bg-amber-500',   textColor: 'text-white' },
      { label: 'Nouvelle facture', href: '/dashboard/invoices',               emoji: '📄', color: 'bg-violet-600',  textColor: 'text-white' },
    ],
  },

  // ── Services / Artisan ───────────────────────────────────────────────────
  // Prestation de service : devis + temps + signatures. Pas de vente physique.
  services: {
    id: 'services',
    label: 'Services / Artisan',
    emoji: '🧹',
    description: 'Ménage, jardinage, artisans, services à domicile',
    accentColor: 'emerald',
    features: {
      produits: false, devis: true,   recurrences: true,  batch: true,   signatures: true,
      stock: false,    pos: false,    boutique: false,    portailClient: false, crm: false,
      commandes: false,
      timeTracking: true,  payroll: true,  marques: false,
      fraud: false, audit: false, postal: false, taxEstimation: true,
    },
    quickActions: [
      { label: 'Nouveau devis',  href: '/dashboard/devis',         emoji: '📋', color: 'bg-blue-600',    textColor: 'text-white' },
      { label: 'Suivi du temps', href: '/dashboard/time-tracking', emoji: '⏱️', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'Clients',        href: '/dashboard/clients',       emoji: '👥', color: 'bg-violet-600',  textColor: 'text-white' },
      { label: 'Signatures',     href: '/dashboard/signatures',    emoji: '✍️', color: 'bg-amber-500',   textColor: 'text-white' },
    ],
  },

  // ── Freelance / Consultant ───────────────────────────────────────────────
  // Solo : factures + devis + temps. Minimaliste, aucune section vente.
  freelance: {
    id: 'freelance',
    label: 'Freelance / Consultant',
    emoji: '💻',
    description: 'Développeur, designer, consultant indépendant',
    accentColor: 'violet',
    features: {
      produits: false, devis: true,   recurrences: true,  batch: false,  signatures: true,
      stock: false,    pos: false,    boutique: false,    portailClient: false, crm: false,
      commandes: false,
      timeTracking: true,  payroll: false, marques: false,
      fraud: false, audit: false, postal: false, taxEstimation: true,
    },
    quickActions: [
      { label: 'Nouvelle facture', href: '/dashboard/invoices',      emoji: '📄', color: 'bg-blue-600',    textColor: 'text-white' },
      { label: 'Nouveau devis',    href: '/dashboard/devis',         emoji: '📋', color: 'bg-violet-600',  textColor: 'text-white' },
      { label: 'Suivi du temps',   href: '/dashboard/time-tracking', emoji: '⏱️', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'TVA',              href: '/dashboard/tva',           emoji: '🧮', color: 'bg-amber-500',   textColor: 'text-white' },
    ],
  },

  // ── Restauration / Food ──────────────────────────────────────────────────
  // Vente directe : POS + stock + fournisseurs. Pas de devis ni CRM.
  restauration: {
    id: 'restauration',
    label: 'Restauration / Food',
    emoji: '🍽️',
    description: 'Restaurant, café, food truck, traiteur',
    accentColor: 'orange',
    features: {
      produits: true,  devis: false,  recurrences: false, batch: false,  signatures: false,
      stock: true,     pos: true,     boutique: false,    portailClient: false, crm: false,
      commandes: true,
      timeTracking: true,  payroll: true,  marques: false,
      fraud: false, audit: false, postal: false, taxEstimation: true,
    },
    quickActions: [
      { label: 'Caisse POS',   href: '/dashboard/pos',                   emoji: '🍴', color: 'bg-orange-500',  textColor: 'text-white' },
      { label: 'Stock',        href: '/dashboard/stock',                  emoji: '📦', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'Fournisseurs', href: '/dashboard/commandes-fournisseurs', emoji: '🚚', color: 'bg-amber-500',   textColor: 'text-white' },
      { label: 'Salaires',     href: '/dashboard/payroll',                emoji: '💶', color: 'bg-violet-600',  textColor: 'text-white' },
    ],
  },

  // ── Construction / BTP ──────────────────────────────────────────────────
  // Chantiers : devis + signatures + stock + fournisseurs. Pas de vente ni CRM.
  construction: {
    id: 'construction',
    label: 'Construction / BTP',
    emoji: '🏗️',
    description: 'Maçon, électricien, plombier, menuisier',
    accentColor: 'amber',
    features: {
      produits: true,  devis: true,   recurrences: false, batch: false,  signatures: true,
      stock: true,     pos: false,    boutique: false,    portailClient: false, crm: false,
      commandes: true,
      timeTracking: true,  payroll: true,  marques: false,
      fraud: false, audit: false, postal: false, taxEstimation: true,
    },
    quickActions: [
      { label: 'Nouveau devis',  href: '/dashboard/devis',                   emoji: '📋', color: 'bg-amber-500',   textColor: 'text-white' },
      { label: 'Suivi du temps', href: '/dashboard/time-tracking',           emoji: '⏱️', color: 'bg-blue-600',    textColor: 'text-white' },
      { label: 'Signatures',     href: '/dashboard/signatures',              emoji: '✍️', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'Fournisseurs',   href: '/dashboard/commandes-fournisseurs',  emoji: '🚚', color: 'bg-violet-600',  textColor: 'text-white' },
    ],
  },

  // ── Santé / Bien-être ────────────────────────────────────────────────────
  // Consultations : factures récurrentes + signatures. Pas de stock ni vente.
  sante: {
    id: 'sante',
    label: 'Santé / Bien-être',
    emoji: '🏥',
    description: 'Médecin, thérapeute, coach, kinésithérapeute',
    accentColor: 'teal',
    features: {
      produits: false, devis: true,   recurrences: true,  batch: false,  signatures: true,
      stock: false,    pos: false,    boutique: false,    portailClient: false, crm: false,
      commandes: false,
      timeTracking: true,  payroll: false, marques: false,
      fraud: false, audit: false, postal: false, taxEstimation: true,
    },
    quickActions: [
      { label: 'Nouvelle facture', href: '/dashboard/invoices',   emoji: '📄', color: 'bg-blue-600',    textColor: 'text-white' },
      { label: 'Clients',          href: '/dashboard/clients',    emoji: '👤', color: 'bg-teal-600',    textColor: 'text-white' },
      { label: 'Signatures',       href: '/dashboard/signatures', emoji: '✍️', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'TVA',              href: '/dashboard/tva',        emoji: '🧮', color: 'bg-amber-500',   textColor: 'text-white' },
    ],
  },

  // ── PME / Entreprise — tout activé ──────────────────────────────────────
  pme: {
    id: 'pme',
    label: 'PME / Entreprise',
    emoji: '🏢',
    description: 'Petite ou moyenne entreprise, toutes activités',
    accentColor: 'gray',
    features: {
      produits: true,  devis: true,   recurrences: true,  batch: true,   signatures: true,
      stock: true,     pos: true,     boutique: true,     portailClient: true,  crm: true,
      commandes: true,
      timeTracking: true,  payroll: true,  marques: true,
      fraud: true,  audit: true,  postal: true,  taxEstimation: true,
    },
    quickActions: [
      { label: 'Nouvelle facture', href: '/dashboard/invoices', emoji: '📄', color: 'bg-blue-600',    textColor: 'text-white' },
      { label: 'Nouveau devis',    href: '/dashboard/devis',    emoji: '📋', color: 'bg-violet-600',  textColor: 'text-white' },
      { label: 'CRM Pipeline',     href: '/dashboard/crm',      emoji: '🎯', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'Rapports',         href: '/dashboard/reports',  emoji: '📊', color: 'bg-amber-500',   textColor: 'text-white' },
    ],
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Retourne vrai si la feature `key` est activée pour ce profil (défaut: tout activé si profil null) */
export function profileHasFeature(
  profilMetier: ProfilMetier | null | undefined,
  key: keyof ProfileFeatures,
): boolean {
  if (!profilMetier) return true; // Pas encore de profil → tout visible
  return BUSINESS_PROFILES[profilMetier]?.features[key] ?? true;
}

/** Liste ordonnée des profils pour l'affichage dans la modal d'onboarding */
export const PROFIL_LIST: ProfilMetier[] = [
  'commerce',
  'services',
  'freelance',
  'restauration',
  'construction',
  'sante',
  'pme',
];
