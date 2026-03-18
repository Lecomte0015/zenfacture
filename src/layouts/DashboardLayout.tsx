import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { Bell } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/dashboard/invoices': 'Factures',
  '/dashboard/invoices/new': 'Nouvelle facture',
  '/dashboard/devis': 'Devis',
  '/dashboard/avoirs': 'Avoirs',
  '/dashboard/recurrences': 'Récurrences',
  '/dashboard/clients': 'Clients',
  '/dashboard/produits': 'Produits',
  '/dashboard/expenses': 'Dépenses',
  '/dashboard/banking': 'E-banking',
  '/dashboard/comptabilite': 'Comptabilité',
  '/dashboard/tva': 'TVA',
  '/dashboard/ebill': 'eBill',
  '/dashboard/fiduciaire': 'Fiduciaire',
  '/dashboard/import': 'Import',
  '/dashboard/reports': 'Rapports',
  '/dashboard/team': 'Équipe',
  '/dashboard/api': 'API',
  '/dashboard/support': 'Support',
  '/dashboard/settings': 'Paramètres',
  '/dashboard/profile': 'Profil',
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'ZenFacture';

  // Initiales pour l'avatar
  const getInitials = () => {
    const name = user?.user_metadata?.name || user?.email || '';
    const parts = name.split(/[\s@]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() || 'ZF';
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const avatarColors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];
  const avatarColor = avatarColors[(userName.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Barre du haut */}
        <div className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center px-6 justify-between shadow-sm">
          {/* Titre de la page active */}
          <span className="text-sm font-semibold text-gray-700">{pageTitle}</span>

          {/* Actions droite */}
          <div className="flex items-center gap-3">
            <button
              title="Notifications"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div
              className={`w-8 h-8 rounded-full ${avatarColor} text-white text-xs font-bold flex items-center justify-center cursor-default`}
              title={user?.email}
            >
              {getInitials()}
            </div>
          </div>
        </div>

        {/* Page */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
