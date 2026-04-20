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
  /** Point de vente */
  pos: boolean;
  /** Gestion de stock */
  stock: boolean;
  /** Boutiques en ligne */
  boutique: boolean;
  /** Multi-marques */
  marques: boolean;
  /** Suivi du temps */
  timeTracking: boolean;
  /** CRM Pipeline */
  crm: boolean;
  /** Portail client */
  portailClient: boolean;
  /** Signatures électroniques */
  signatures: boolean;
  /** Commandes fournisseurs */
  commandes: boolean;
  /** Gestion salaires / paie */
  payroll: boolean;
  /** Facturation groupée */
  batch: boolean;
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
  commerce: {
    id: 'commerce',
    label: 'Commerce / Boutique',
    emoji: '🛍️',
    description: 'Vente au détail, boutique physique ou en ligne',
    accentColor: 'blue',
    features: {
      pos: true, stock: true, boutique: true, marques: true,
      timeTracking: false, crm: false, portailClient: false,
      signatures: false, commandes: true, payroll: true,
      batch: true, fraud: true, audit: true, postal: true,
      taxEstimation: true,
    },
    quickActions: [
      { label: 'Caisse POS',      href: '/dashboard/pos',                     emoji: '🏪', color: 'bg-blue-600',   textColor: 'text-white' },
      { label: 'Stock',           href: '/dashboard/stock',                    emoji: '📦', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'Fournisseurs',    href: '/dashboard/commandes-fournisseurs',   emoji: '🚚', color: 'bg-amber-500',  textColor: 'text-white' },
      { label: 'Nouvelle facture',href: '/dashboard/invoices',                 emoji: '📄', color: 'bg-violet-600', textColor: 'text-white' },
    ],
  },

  // ── Services / Artisan ───────────────────────────────────────────────────
  services: {
    id: 'services',
    label: 'Services / Artisan',
    emoji: '🧹',
    description: 'Ménage, jardinage, artisans, services à domicile',
    accentColor: 'emerald',
    features: {
      pos: false, stock: false, boutique: false, marques: false,
      timeTracking: true, crm: true, portailClient: true,
      signatures: true, commandes: false, payroll: true,
      batch: true, fraud: false, audit: false, postal: true,
      taxEstimation: true,
    },
    quickActions: [
      { label: 'Nouveau devis',   href: '/dashboard/devis',         emoji: '📋', color: 'bg-blue-600',   textColor: 'text-white' },
      { label: 'Suivi du temps',  href: '/dashboard/time-tracking', emoji: '⏱️', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'Clients',         href: '/dashboard/clients',       emoji: '👥', color: 'bg-violet-600', textColor: 'text-white' },
      { label: 'Récurrences',     href: '/dashboard/recurrences',   emoji: '🔄', color: 'bg-amber-500',  textColor: 'text-white' },
    ],
  },

  // ── Freelance / Consultant ───────────────────────────────────────────────
  freelance: {
    id: 'freelance',
    label: 'Freelance / Consultant',
    emoji: '💻',
    description: 'Développeur, designer, consultant indépendant',
    accentColor: 'violet',
    features: {
      pos: false, stock: false, boutique: false, marques: false,
      timeTracking: true, crm: true, portailClient: true,
      signatures: true, commandes: false, payroll: false,
      batch: false, fraud: false, audit: false, postal: false,
      taxEstimation: true,
    },
    quickActions: [
      { label: 'Nouvelle facture', href: '/dashboard/invoices',        emoji: '📄', color: 'bg-blue-600',   textColor: 'text-white' },
      { label: 'Nouveau devis',    href: '/dashboard/devis',           emoji: '📋', color: 'bg-violet-600', textColor: 'text-white' },
      { label: 'Suivi du temps',   href: '/dashboard/time-tracking',   emoji: '⏱️', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'TVA',              href: '/dashboard/tva',             emoji: '🧮', color: 'bg-amber-500',  textColor: 'text-white' },
    ],
  },

  // ── Restauration / Food ──────────────────────────────────────────────────
  restauration: {
    id: 'restauration',
    label: 'Restauration / Food',
    emoji: '🍽️',
    description: 'Restaurant, café, food truck, traiteur',
    accentColor: 'orange',
    features: {
      pos: true, stock: true, boutique: false, marques: true,
      timeTracking: true, crm: false, portailClient: false,
      signatures: false, commandes: true, payroll: true,
      batch: false, fraud: false, audit: false, postal: false,
      taxEstimation: true,
    },
    quickActions: [
      { label: 'Caisse POS',   href: '/dashboard/pos',                   emoji: '🍴', color: 'bg-orange-500', textColor: 'text-white' },
      { label: 'Stock',        href: '/dashboard/stock',                  emoji: '📦', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'Fournisseurs', href: '/dashboard/commandes-fournisseurs', emoji: '🚚', color: 'bg-amber-500',  textColor: 'text-white' },
      { label: 'Salaires',     href: '/dashboard/payroll',                emoji: '💶', color: 'bg-violet-600', textColor: 'text-white' },
    ],
  },

  // ── Construction / BTP ──────────────────────────────────────────────────
  construction: {
    id: 'construction',
    label: 'Construction / BTP',
    emoji: '🏗️',
    description: 'Maçon, électricien, plombier, menuisier',
    accentColor: 'amber',
    features: {
      pos: false, stock: true, boutique: false, marques: true,
      timeTracking: true, crm: true, portailClient: true,
      signatures: true, commandes: true, payroll: true,
      batch: true, fraud: true, audit: true, postal: true,
      taxEstimation: true,
    },
    quickActions: [
      { label: 'Nouveau devis',  href: '/dashboard/devis',                   emoji: '📋', color: 'bg-amber-500',  textColor: 'text-white' },
      { label: 'Suivi du temps', href: '/dashboard/time-tracking',           emoji: '⏱️', color: 'bg-blue-600',   textColor: 'text-white' },
      { label: 'Signatures',     href: '/dashboard/signatures',              emoji: '✍️', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'Fournisseurs',   href: '/dashboard/commandes-fournisseurs',  emoji: '🚚', color: 'bg-violet-600', textColor: 'text-white' },
    ],
  },

  // ── Santé / Bien-être ────────────────────────────────────────────────────
  sante: {
    id: 'sante',
    label: 'Santé / Bien-être',
    emoji: '🏥',
    description: 'Médecin, thérapeute, coach, kinésithérapeute',
    accentColor: 'teal',
    features: {
      pos: false, stock: false, boutique: false, marques: false,
      timeTracking: true, crm: true, portailClient: true,
      signatures: true, commandes: false, payroll: false,
      batch: false, fraud: false, audit: false, postal: true,
      taxEstimation: true,
    },
    quickActions: [
      { label: 'Nouvelle facture', href: '/dashboard/invoices',  emoji: '📄', color: 'bg-blue-600',   textColor: 'text-white' },
      { label: 'Clients',          href: '/dashboard/clients',   emoji: '👤', color: 'bg-teal-600',   textColor: 'text-white' },
      { label: 'Signatures',       href: '/dashboard/signatures',emoji: '✍️', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'TVA',              href: '/dashboard/tva',       emoji: '🧮', color: 'bg-amber-500',  textColor: 'text-white' },
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
      pos: true, stock: true, boutique: true, marques: true,
      timeTracking: true, crm: true, portailClient: true,
      signatures: true, commandes: true, payroll: true,
      batch: true, fraud: true, audit: true, postal: true,
      taxEstimation: true,
    },
    quickActions: [
      { label: 'Nouvelle facture', href: '/dashboard/invoices', emoji: '📄', color: 'bg-blue-600',   textColor: 'text-white' },
      { label: 'Nouveau devis',    href: '/dashboard/devis',    emoji: '📋', color: 'bg-violet-600', textColor: 'text-white' },
      { label: 'CRM Pipeline',     href: '/dashboard/crm',      emoji: '🎯', color: 'bg-emerald-600', textColor: 'text-white' },
      { label: 'Rapports',         href: '/dashboard/reports',  emoji: '📊', color: 'bg-amber-500',  textColor: 'text-white' },
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
