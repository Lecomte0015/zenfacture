import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Bell,
  Settings,
  ArrowLeft,
  Shield
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/admin/users', icon: Users, label: 'Utilisateurs' },
    { path: '/dashboard/admin/organisations', icon: Building2, label: 'Organisations' },
    { path: '/dashboard/admin/rappels', icon: Bell, label: 'Rappels' },
    { path: '/dashboard/admin/settings', icon: Settings, label: 'Configuration' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 mr-3" />
              <div>
                <h1 className="text-xl font-bold">Admin Back-Office</h1>
                <p className="text-xs text-red-100">Super Administrateur</p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center text-white hover:text-red-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour au Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center px-3 py-4 border-b-2 text-sm font-medium transition-colors
                    ${
                      active
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
