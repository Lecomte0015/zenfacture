import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiFileText, FiMenu, FiX } from 'react-icons/fi';

const navLinks = [
  { name: 'Fonctionnalités', href: '/features' },
  { name: 'Tarifs',          href: '/pricing' },
  { name: 'Aide',            href: '/help' },
];

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) => location.pathname === href;

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md transition-shadow duration-200 border-b border-gray-100 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <FiFileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Zen<span className="text-blue-600">Facture</span>
            </span>
          </Link>

          {/* Nav desktop */}
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

          {/* CTAs desktop */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              to="/auth/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to="/auth/register"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
            >
              Essai gratuit →
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            onClick={() => setOpen(o => !o)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {open ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1 shadow-lg">
          {navLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive(link.href) ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 mt-2">
            <Link
              to="/auth/login"
              className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Se connecter
            </Link>
            <Link
              to="/auth/register"
              className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500"
            >
              Essai gratuit 30 jours →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-10 border-b border-gray-800">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <FiFileText className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-bold text-white">
                Zen<span className="text-blue-400">Facture</span>
              </span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
              La solution de facturation QR suisse pour indépendants et PME.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="text-xs text-gray-500">Hébergé en Suisse · nLPD conforme</span>
            </div>
          </div>

          {[
            {
              title: 'Produit',
              links: [
                { label: 'Fonctionnalités', href: '/features' },
                { label: 'Tarifs',          href: '/pricing' },
                { label: 'Documentation',   href: '/documentation' },
              ],
            },
            {
              title: 'Support',
              links: [
                { label: "Centre d'aide", href: '/help' },
                { label: 'FAQ',           href: '/faq' },
                { label: 'Contact',       href: '/help' },
              ],
            },
            {
              title: 'Légal',
              links: [
                { label: 'CGU',             href: '/cgu' },
                { label: 'Confidentialité', href: '/confidentialite' },
              ],
            },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.href}
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {year} ZenFacture SA. Tous droits réservés.</p>
          <span>🇨🇭 Swiss Made Software</span>
        </div>
      </div>
    </footer>
  );
};

// Compatibilité avec App.tsx qui n'utilise pas Outlet mais children
export const PublicLayout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const isLanding = ['/', '/features', '/pricing', '/help', '/faq',
    '/documentation', '/cgu', '/confidentialite'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        {isLanding ? (
          children ?? <Outlet />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children ?? <Outlet />}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
