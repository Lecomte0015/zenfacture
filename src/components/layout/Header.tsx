import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { FiMenu, FiX, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Fonctionnalités', href: '/features' },
  { name: 'Tarifs', href: '/pricing' },
  { name: 'Aide', href: '/help' },
];

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between border-b border-blue-500 py-6 lg:border-none">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">ZenFacture</span>
            </Link>
            <div className="ml-10 hidden space-x-8 lg:block">
              {navigation.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-base font-medium text-gray-500 hover:text-gray-900"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="ml-10 space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                    <span className="sr-only">Ouvrir le menu utilisateur</span>
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      <FiUser className="h-5 w-5" />
                    </div>
                    <span className="hidden md:inline">{user?.name || 'Mon compte'}</span>
                    <FiChevronDown className="h-4 w-4" />
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
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/dashboard"
                            className={`block px-4 py-2 text-sm ${
                              active ? 'bg-gray-100' : ''
                            }`}
                          >
                            Tableau de bord
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              active ? 'bg-gray-100' : ''
                            } text-red-600`}
                          >
                            <div className="flex items-center space-x-2">
                              <FiLogOut className="h-4 w-4" />
                              <span>Déconnexion</span>
                            </div>
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="inline-block rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Rejoindre la bêta
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="flex flex-wrap justify-center space-x-6 py-4 lg:hidden">
          {navigation.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-base font-medium text-gray-500 hover:text-gray-900"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;
