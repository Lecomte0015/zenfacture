import { Fragment, useState, useEffect } from 'react'; // Fragment used by Menu.Transition
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  FiUser, FiLogOut, FiChevronDown, FiMenu, FiX,
  FiFileText, FiDollarSign, FiHelpCircle, FiGrid
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import TrialStatusBadge from '../common/TrialStatusBadge';

const navLinks = [
  { name: 'Fonctionnalités', href: '/features', icon: FiGrid },
  { name: 'Tarifs',          href: '/pricing',  icon: FiDollarSign },
  { name: 'Aide',            href: '/help',     icon: FiHelpCircle },
];

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  // Fermer le menu mobile à chaque changement de page
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Ombre sur scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-8">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                <FiFileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Zen<span className="text-blue-600">Facture</span>
              </span>
            </Link>

            {/* ── Nav desktop ── */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* ── Actions desktop ── */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {isAuthenticated ? (
                <>
                  <TrialStatusBadge />
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="hidden lg:inline max-w-[120px] truncate">
                        {user?.name || 'Mon compte'}
                      </span>
                      <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none py-1.5 divide-y divide-gray-100">
                        <div className="px-4 py-2.5">
                          <p className="text-xs text-gray-400">Connecté en tant que</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{user?.email || user?.name}</p>
                        </div>
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-50' : ''}`}>
                                <FiGrid className="w-4 h-4 text-gray-400" />
                                Tableau de bord
                              </Link>
                            )}
                          </Menu.Item>
                        </div>
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button onClick={handleLogout} className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 ${active ? 'bg-red-50' : ''}`}>
                                <FiLogOut className="w-4 h-4" />
                                Déconnexion
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all hover:shadow-md"
                  >
                    Essai gratuit →
                  </Link>
                </>
              )}
            </div>

            {/* ── Burger mobile ── */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Menu"
            >
              {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Menu mobile ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1 shadow-lg animate-fadeIn">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(link.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 mt-2">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <FiGrid className="w-4 h-4" /> Dashboard
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-100 rounded-lg hover:bg-red-50">
                    <FiLogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                    Se connecter
                  </Link>
                  <Link to="/register" className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    Essai gratuit 30 jours →
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
