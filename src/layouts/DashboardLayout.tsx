import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import ProfilMetierModal from '@/components/dashboard/ProfilMetierModal';
import NotificationsDropdown from '@/components/dashboard/NotificationsDropdown';
import UserMenu from '@/components/dashboard/UserMenu';
import AnnouncementBanner from '@/components/common/AnnouncementBanner';
import TrialBanner from '@/components/dashboard/TrialBanner';

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
  '/dashboard/rappels':                   'Rappels & cotisations',
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Dashboard';

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TrialBanner />
        <AnnouncementBanner />

        {/* Top header bar */}
        <div className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm z-10">
          {/* Left — page title (extra left padding on mobile for burger button) */}
          <div className="pl-16 lg:pl-6">
            <span className="text-sm font-semibold text-gray-700">{pageTitle}</span>
          </div>

          {/* Right — notifications + compte */}
          <div className="flex items-center gap-2 pr-6">
            <NotificationsDropdown />
            <UserMenu variant="header" />
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
