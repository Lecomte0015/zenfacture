import { Link } from 'react-router-dom';
import { FiFileText, FiMail, FiTwitter, FiLinkedin } from 'react-icons/fi';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-gray-800">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <FiFileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Zen<span className="text-blue-400">Facture</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
              La solution de facturation QR suisse pensée pour les indépendants et PME.
              Simple, conforme, suisse.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="mailto:hello@zenfacture.ch" className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <FiMail className="w-4 h-4" />
              </a>
              <a href="https://twitter.com/zenfacture" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <FiTwitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com/company/zenfacture" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <FiLinkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Produit</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Fonctionnalités', href: '/features' },
                { label: 'Tarifs',          href: '/pricing' },
                { label: 'QR-Facture',      href: '/features#qr' },
                { label: 'TWINT',           href: '/features#twint' },
                { label: 'API',             href: '/documentation' },
              ].map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Ressources</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Documentation', href: '/documentation' },
                { label: 'Centre d\'aide', href: '/help' },
                { label: 'FAQ',           href: '/faq' },
                { label: 'Blog',          href: '/blog' },
              ].map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Légal</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Mentions légales',         href: '/legal' },
                { label: 'Politique de confidentialité', href: '/privacy' },
                { label: 'CGU',                      href: '/terms' },
                { label: 'Sécurité des données',     href: '/security' },
              ].map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <p>© {year} ZenFacture. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              Hébergé en Suisse
            </span>
            <span>🇨🇭 Swiss Made Software</span>
            <span>nLPD conforme</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
