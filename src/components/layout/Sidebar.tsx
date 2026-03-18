import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, LifeBuoy, Code, Menu, X, Bell, DollarSign, BarChart2, Timer, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Factures', href: '/dashboard/invoices', icon: FileText },
  { name: 'Dépenses', href: '/dashboard/expenses', icon: DollarSign },
  { name: 'Rapports', href: '/dashboard/reports', icon: BarChart2 },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Suivi du temps', href: '/dashboard/time-tracking', icon: Timer },
  { name: 'Équipe', href: '/dashboard/team', icon: Users },
  { name: 'Salaires', href: '/dashboard/payroll', icon: Wallet },
  { name: 'Rappels', href: '/dashboard/admin/rappels', icon: Bell },
  { name: 'Support', href: '/support', icon: LifeBuoy },
];

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, aLaFonctionnalite } = useAuth();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">ZenFacture</h1>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  location.pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
            
            {aLaFonctionnalite('api') && (
              <Link
                to="/dashboard/api"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  location.pathname === '/dashboard/api'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Code className="mr-3 h-5 w-5 flex-shrink-0" />
                API
              </Link>
            )}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                <p className="text-xs text-gray-500">{user?.plan} Plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
