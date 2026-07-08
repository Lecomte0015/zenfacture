import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  User as UserIcon,
  Settings,
  CreditCard,
  LogOut,
  HelpCircle,
  ChevronsUpDown,
} from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  essentiel: 'Essentiel',
  pro: 'Pro',
  entreprise: 'Entreprise',
};

interface UserMenuProps {
  /** 'header' = avatar rond en haut à droite · 'sidebar' = carte complète en bas du menu latéral */
  variant?: 'header' | 'sidebar';
}

/**
 * Menu de compte unique, utilisé à deux endroits (header + sidebar) pour éviter
 * d'avoir deux zones "profil" incohérentes. Le contenu du menu déroulant est
 * strictement identique dans les deux cas ; seul le déclencheur visuel change.
 */
export const UserMenu = ({ variant = 'header' }: UserMenuProps) => {
  const { user, logout } = useAuth();

  const getInitials = () => {
    const name = (user?.user_metadata?.name as string) || user?.email || '';
    const parts = name.split(/[\s@]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() || 'ZF';
  };

  const userName = (user?.user_metadata?.name as string) || user?.email?.split('@')[0] || 'Utilisateur';
  const planLabel = PLAN_LABELS[user?.plan || 'essentiel'] || 'Essentiel';

  const menuItems = [
    { to: '/dashboard/profile', label: 'Mon profil', icon: UserIcon },
    { to: '/dashboard/settings', label: 'Paramètres', icon: Settings },
    { to: '/dashboard/billing', label: 'Abonnement', icon: CreditCard },
    { to: '/dashboard/support', label: 'Aide & support', icon: HelpCircle },
  ];

  return (
    <Menu as="div" className={variant === 'sidebar' ? 'relative w-full' : 'relative'}>
      {variant === 'header' ? (
        <Menu.Button
          title={user?.email}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs font-bold flex items-center justify-center shadow-warm select-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 transition-transform hover:scale-105"
          aria-label="Menu du compte"
        >
          {getInitials()}
        </Menu.Button>
      ) : (
        <Menu.Button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-200 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">Plan {planLabel}</p>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        </Menu.Button>
      )}

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute z-50 w-64 rounded-xl bg-white shadow-card-hover border border-gray-100 focus:outline-none overflow-hidden ${
            variant === 'header'
              ? 'right-0 mt-2 origin-top-right'
              : 'left-0 bottom-full mb-2 origin-bottom-left'
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center mt-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 border border-primary-200">
              Plan {planLabel}
            </span>
          </div>

          <div className="py-1">
            {menuItems.map(({ to, label, icon: Icon }) => (
              <Menu.Item key={to}>
                {({ active }) => (
                  <Link
                    to={to}
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                )}
              </Menu.Item>
            ))}
          </div>

          <div className="py-1 border-t border-gray-100">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => logout()}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 ${
                    active ? 'bg-red-50' : ''
                  }`}
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default UserMenu;
