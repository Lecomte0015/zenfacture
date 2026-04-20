import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Bell } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import ProfilMetierModal from '@/components/dashboard/ProfilMetierModal';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':                          'Tableau de bord',
  '/dashboard/invoices':                 'Factures',
  '/dashboard/devis':                    'Devis',
  '/dashboard/avoirs':                   'Avoirs',
  '/dashboard/recurrences':             'Récurrences',
  '/dashboard/batch-invoice':           'Facturation groupée',
  '/dashboard/signatures':              'Signatures électroniques',
  '/dashboard/clients':                  'Clients',
  '/dashboard/produits':                 'Produits',
  '/dashboard/stock':                    'Stock',
  '/dashboard/expenses':                 'Dépenses',
  '/dashboard/banking':                  'E-banking',
  '/dashboard/comptabilite':             'Comptabilité',
  '/dashboard/tva':                      'TVA',
  '/dashboard/ebill':                    'eBill',
  '/dashboard/fiduciaire':               'Fiduciaire',
  '/dashboard/import':                   'Import',
  '/dashboard/archive':                  'Archives (nLPD)',
  '/dashboard/tax-estimation':          'Estimation fiscale',
  '/dashboard/postal':                   'Envoi postal',
  '/dashboard/reports':                  'Rapports',
  '/dashboard/fraud-detection':         'Détection de fraude',
  '/dashboard/audit-trail':             'Audit Trail',
  '/dashboard/crm':                      'CRM Pipeline',
  '/dashboard/pos':                      'Point de vente',
  '/dashboard/boutique':                 'Boutiques en ligne',
  '/dashboard/portail-client':          'Portail client',
  '/dashboard/commandes-fournisseurs':  'Commandes fournisseurs',
  '/dashboard/time-tracking':           'Suivi du temps',
  '/dashboard/payroll':                  'Salaires',
  '/dashboard/marques':                  'Multi-marques',
  '/dashboard/team':                     'Équipe',
  '/dashboard/api':                      'API',
  '/dashboard/support':                  'Support',
  '/dashboard/profile':                  'Profil',
  '/dashboard/settings':                 'Paramètres',
  '/dashboard/billing':                  'Abonnement',
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Dashboard';

  const getInitials = () => {
    const name = (user?.user_metadata?.name as string) || user?.email || '';
    return name
      .split(/[\s@]/)
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Top header bar */}
        <div className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm z-10">
          {/* Left — page title (extra left padding on mobile for burger button) */}
          <div className="pl-16 lg:pl-6">
            <span className="text-sm font-semibold text-gray-700">{pageTitle}</span>
          </div>

          {/* Right — notifications + avatar */}
          <div className="flex items-center gap-2 pr-6">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            <div
              title={user?.email}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-600/30 cursor-pointer select-none"
            >
              {getInitials()}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Modal onboarding profil métier — s'affiche si profil_metier est null */}
      <ProfilMetierModal />
    </div>
  );
};

export default DashboardLayout;
