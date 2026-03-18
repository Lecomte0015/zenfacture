import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Menu, X, Home, FileText, Users, Code, HelpCircle,
  ChevronDown, ChevronRight, BarChart2, Package, ClipboardList,
  RefreshCw, CreditCard, Upload, Building2, Calculator,
  BookOpen, Zap, Shield, LogOut, Settings, Archive,
  Timer, Wallet, Send, Boxes, PieChart, Layers,
  Mail, ShoppingCart, Link2, AlertOctagon,
} from 'lucide-react';

interface SidebarProps {
  children?: ReactNode;
}

interface NavGroup {
  id: string;
  label: string;
  emoji: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  feature?: string;
}

const navGroups: NavGroup[] = [
  {
    id: 'facturation',
    label: 'Facturation',
    emoji: '📋',
    items: [
      { name: 'Factures', href: '/dashboard/invoices', icon: FileText },
      { name: 'Devis', href: '/dashboard/devis', icon: ClipboardList },
      { name: 'Avoirs', href: '/dashboard/avoirs', icon: CreditCard },
      { name: 'Récurrences', href: '/dashboard/recurrences', icon: RefreshCw },
      { name: 'Facturation groupée', href: '/dashboard/batch-invoice', icon: Send },
    ],
  },
  {
    id: 'clients',
    label: 'Clients & Produits',
    emoji: '👥',
    items: [
      { name: 'Clients', href: '/dashboard/clients', icon: Users },
      { name: 'Produits', href: '/dashboard/produits', icon: Package },
      { name: 'Stock', href: '/dashboard/stock', icon: Boxes },
    ],
  },
  {
    id: 'depenses',
    label: 'Dépenses',
    emoji: '💸',
    items: [
      { name: 'Dépenses', href: '/dashboard/expenses', icon: FileText },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    emoji: '🏦',
    items: [
      { name: 'E-banking', href: '/dashboard/banking', icon: Building2 },
      { name: 'Comptabilité', href: '/dashboard/comptabilite', icon: BookOpen },
      { name: 'TVA', href: '/dashboard/tva', icon: Calculator },
      { name: 'eBill', href: '/dashboard/ebill', icon: Zap },
      { name: 'Fiduciaire', href: '/dashboard/fiduciaire', icon: Shield },
      { name: 'Import', href: '/dashboard/import', icon: Upload },
      { name: 'Archives (nLPD)', href: '/dashboard/archive', icon: Archive },
      { name: 'Estimation fiscale', href: '/dashboard/tax-estimation', icon: PieChart },
      { name: 'Envoi postal', href: '/dashboard/postal', icon: Mail },
    ],
  },
  {
    id: 'rapports',
    label: 'Rapports',
    emoji: '📊',
    items: [
      { name: 'Rapports', href: '/dashboard/reports', icon: BarChart2 },
      { name: 'Détection fraude', href: '/dashboard/fraud-detection', icon: AlertOctagon },
      { name: 'Audit Trail', href: '/dashboard/audit-trail', icon: Link2 },
    ],
  },
  {
    id: 'ventes',
    label: 'Ventes',
    emoji: '🛒',
    items: [
      { name: 'Point de vente (POS)', href: '/dashboard/pos', icon: ShoppingCart },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    emoji: '⚙️',
    items: [
      { name: 'Suivi du temps', href: '/dashboard/time-tracking', icon: Timer },
      { name: 'Salaires', href: '/dashboard/payroll', icon: Wallet },
      { name: 'Multi-marques', href: '/dashboard/marques', icon: Layers },
      { name: 'Équipe', href: '/dashboard/team', icon: Users },
      { name: 'API', href: '/dashboard/api', icon: Code, feature: 'api' },
      { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
    ],
  },
];

const STORAGE_KEY = 'sidebar_collapsed_groups';

export const Sidebar = ({ children }: SidebarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Collapse state par groupe, persisté dans localStorage
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch {/* ignore */}
  }, [collapsed]);

  const toggleGroup = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (path: string) => location.pathname === path;

  const hasFeature = (feature?: string) => {
    if (!feature) return true;
    return user?.fonctionnalites?.[feature as keyof typeof user.fonctionnalites] === true;
  };

  // Initiales de l'utilisateur
  const getInitials = () => {
    const name = user?.user_metadata?.name || user?.email || '';
    const parts = name.split(/[\s@]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() || 'ZF';
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Utilisateur';

  // Couleur de l'avatar basée sur les initiales
  const avatarColors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];
  const avatarColor = avatarColors[(userName.charCodeAt(0) || 0) % avatarColors.length];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-800 flex-shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight truncate">ZenFacture</span>
        </Link>
        <span className="ml-auto flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-800">
          Essentiel
        </span>
      </div>

      {/* Lien tableau de bord */}
      <div className="px-3 pt-3">
        <Link
          to="/dashboard"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive('/dashboard')
              ? 'bg-blue-900/40 text-blue-300 border-l-2 border-blue-400'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
          }`}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          Tableau de bord
        </Link>
      </div>

      {/* Navigation groupée */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => hasFeature(item.feature));
          if (visibleItems.length === 0) return null;
          const isCollapsed = collapsed[group.id] ?? false;

          return (
            <div key={group.id}>
              {idx > 0 && <div className="border-t border-gray-800 my-2" />}

              {/* En-tête du groupe */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors rounded-md hover:bg-white/5"
              >
                <span className="flex items-center gap-1.5">
                  <span>{group.emoji}</span>
                  <span>{group.label}</span>
                </span>
                {isCollapsed
                  ? <ChevronRight className="w-3.5 h-3.5" />
                  : <ChevronDown className="w-3.5 h-3.5" />
                }
              </button>

              {/* Items du groupe */}
              {!isCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 pl-9 pr-3 py-1.5 rounded-lg text-sm transition-colors ${
                          active
                            ? 'border-l-2 border-blue-400 bg-blue-900/30 text-blue-300'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Pied : utilisateur */}
      <div className="border-t border-gray-800 p-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className={`w-8 h-8 rounded-full ${avatarColor} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-1 space-y-0.5">
          <Link
            to="/dashboard/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-100 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </Link>
          <button
            onClick={() => { logout(); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Bouton menu mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-gray-900"
        >
          <span className="sr-only">Ouvrir le menu</span>
          {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent />
        </div>
      </div>

      {/* Sidebar mobile (overlay) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 flex z-40">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col max-w-xs w-full">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Fermer le menu</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarContent />
            </div>
          </div>
          <div className="flex-shrink-0 w-14">{children}</div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
