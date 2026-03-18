import { Fragment } from 'react';
import { Bars3Icon as MenuIcon, XMarkIcon as XIcon, UserCircleIcon, Cog6ToothIcon as CogIcon, CreditCardIcon, ArrowRightOnRectangleIcon as LogoutIcon, UserGroupIcon, CodeBracketIcon as CodeIcon, LifebuoyIcon as SupportIcon } from '@heroicons/react/24/outline';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSubscriptionFeatures from '../../hooks/useSubscriptionFeatures';

const Navigation = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const { plan, nomCompletPlan, fonctionnalites, aLaFonctionnalite } = useSubscriptionFeatures();

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Factures', href: '/invoices', current: pathname.startsWith('/invoices') },
    { name: 'Clients', href: '/clients', current: pathname.startsWith('/clients') },
    { 
      name: 'Équipe', 
      href: '/team', 
      current: pathname.startsWith('/team'),
      feature: 'multiUtilisateurs' 
    },
    { 
      name: 'API', 
      href: '/api-keys', 
      current: pathname.startsWith('/api-keys'),
      feature: 'api' 
    },
    { 
      name: 'Support', 
      href: '/support', 
      current: pathname.startsWith('/support'),
      feature: 'supportPrioritaire' 
    },
  ];

  const userNavigation = [
    { name: 'Profil', href: '/profile', icon: UserCircleIcon },
    { name: 'Paramètres', href: '/settings', icon: CogIcon },
    { name: 'Abonnement', href: '/billing', icon: CreditCardIcon },
    { name: 'Déconnexion', href: '#', icon: LogoutIcon, onClick: () => logout() },
  ];

  // Filtrer la navigation en fonction des fonctionnalités disponibles
  const filteredNavigation = navigation.filter(item => 
    !item.feature || aLaFonctionnalite(item.feature as keyof typeof fonctionnalites)
  );

  return (
    <Disclosure as="nav" className="bg-white shadow-sm">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link to="/">
                    <img
                      className="h-8 w-auto"
                      src="/logo.png"
                      alt="ZenFacture"
                    />
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {filteredNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${item.current
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {/* Badge du plan */}
                <div className="ml-4 flex items-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    plan === 'entreprise' 
                      ? 'bg-purple-100 text-purple-800' 
                      : plan === 'pro' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {nomCompletPlan}
                  </span>
                </div>
                
                {/* Menu déroulant utilisateur */}
                <Menu as="div" className="ml-3 relative">
                  <div>
                    <Menu.Button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <span className="sr-only">Ouvrir le menu utilisateur</span>
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={user.user_metadata.avatar_url}
                          alt=""
                        />
                      ) : (
                        <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                      )}
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                        <p className="text-xs text-gray-500">Plan: {nomCompletPlan}</p>
                      </div>
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <Link
                              to={item.href}
                              onClick={item.onClick}
                              className={`${active ? 'bg-gray-100' : ''} group flex items-center px-4 py-2 text-sm text-gray-700`}
                            >
                              <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                              {item.name}
                            </Link>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                  <span className="sr-only">Ouvrir le menu principal</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {filteredNavigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={`${item.current
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              
              {/* Section utilisateur mobile */}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    {user?.user_metadata?.avatar_url ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.user_metadata.avatar_url}
                        alt=""
                      />
                    ) : (
                      <UserCircleIcon className="h-10 w-10 text-gray-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user?.email}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {nomCompletPlan}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {userNavigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      to={item.href}
                      onClick={item.onClick}
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </div>
              
              {/* Fonctionnalités du plan */}
              <div className="px-4 py-3 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Votre plan {nomCompletPlan} inclut :</h3>
                <ul className="space-y-2">
                  {fonctionnalites.multiUtilisateurs && (
                    <li className="flex items-center text-sm text-gray-700">
                      <UserGroupIcon className="h-4 w-4 text-green-500 mr-2" />
                      Gestion d'équipe
                    </li>
                  )}
                  {fonctionnalites.api && (
                    <li className="flex items-center text-sm text-gray-700">
                      <CodeIcon className="h-4 w-4 text-green-500 mr-2" />
                      Accès à l'API
                    </li>
                  )}
                  {fonctionnalites.supportPrioritaire && (
                    <li className="flex items-center text-sm text-gray-700">
                      <SupportIcon className="h-4 w-4 text-green-500 mr-2" />
                      Support {fonctionnalites.support24_7 ? '24/7' : 'prioritaire'}
                    </li>
                  )}
                  {fonctionnalites.facturationAvancee && (
                    <li className="flex items-center text-sm text-gray-700">
                      <CreditCardIcon className="h-4 w-4 text-green-500 mr-2" />
                      Facturation avancée
                    </li>
                  )}
                  {fonctionnalites.exportDonnees && (
                    <li className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export des données
                    </li>
                  )}
                </ul>
                <div className="mt-3">
                  <Link
                    to="/billing"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Mettre à niveau
                  </Link>
                </div>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navigation;
