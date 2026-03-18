export type Permission =
  | 'view_dashboard'
  | 'manage_invoices'
  | 'view_invoices'
  | 'manage_clients'
  | 'view_clients'
  | 'manage_team'
  | 'manage_settings'
  | 'export_data';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer' | 'custom';
  permissions: Permission[];
  status: 'active' | 'pending' | 'inactive';
  lastActive: string | null;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: [
    'view_dashboard',
    'manage_invoices',
    'view_invoices',
    'manage_clients',
    'view_clients',
    'manage_team',
    'manage_settings',
    'export_data',
  ],
  editor: [
    'view_dashboard',
    'manage_invoices',
    'view_invoices',
    'manage_clients',
    'view_clients',
  ],
  viewer: [
    'view_dashboard',
    'view_invoices',
    'view_clients',
  ],
} as const;

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard: 'Voir le tableau de bord',
  manage_invoices: 'Gérer les factures',
  view_invoices: 'Voir les factures',
  manage_clients: 'Gérer les clients',
  view_clients: 'Voir les clients',
  manage_team: 'Gérer l\'équipe',
  manage_settings: 'Gérer les paramètres',
  export_data: 'Exporter les données',
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  view_dashboard: 'Accéder au tableau de bord principal',
  manage_invoices: 'Créer, modifier et supprimer des factures',
  view_invoices: 'Voir la liste des factures et leurs détails',
  manage_clients: 'Ajouter, modifier et supprimer des clients',
  view_clients: 'Voir la liste des clients et leurs détails',
  manage_team: 'Inviter et gérer les membres de l\'équipe',
  manage_settings: 'Modifier les paramètres de l\'application',
  export_data: 'Exporter les données de l\'application',
};
