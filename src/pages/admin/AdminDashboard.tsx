import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  FileText,
  TrendingUp,
  CreditCard,
  CheckCircle,
  DollarSign,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Stats {
  totalUsers: number;
  totalOrganisations: number;
  totalInvoices: number;
  totalRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  recentActivity: any[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOrganisations: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Compter les utilisateurs
      const { count: usersCount } = await supabase
        .from('profils')
        .select('*', { count: 'exact', head: true });

      // Compter les organisations
      const { count: orgsCount } = await supabase
        .from('organisations')
        .select('*', { count: 'exact', head: true });

      // Compter les factures
      const { count: invoicesCount } = await supabase
        .from('factures')
        .select('*', { count: 'exact', head: true });

      // Calculer le revenu total (somme des factures payées)
      const { data: paidInvoices } = await supabase
        .from('factures')
        .select('total')
        .eq('status', 'paid');

      const revenue = paidInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

      // Compter les abonnements actifs
      const { count: activeSubsCount } = await supabase
        .from('organisations')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active');

      // Compter les essais gratuits
      const { count: trialSubsCount } = await supabase
        .from('organisations')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'trial');

      setStats({
        totalUsers: usersCount || 0,
        totalOrganisations: orgsCount || 0,
        totalInvoices: invoicesCount || 0,
        totalRevenue: revenue,
        activeSubscriptions: activeSubsCount || 0,
        trialSubscriptions: trialSubsCount || 0,
        recentActivity: [],
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    color: string;
  }> = ({ title, value, icon, trend, color }) => (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="inline w-4 h-4" /> {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Back-Office Admin</h1>
        <p className="text-gray-600 mt-2">
          Vue d'ensemble de la plateforme ZenFacture
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Utilisateurs"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Organisations"
          value={stats.totalOrganisations}
          icon={<Building2 className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Factures créées"
          value={stats.totalInvoices}
          icon={<FileText className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Revenu total"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />
      </div>

      {/* Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Abonnements actifs</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
          <p className="text-sm text-gray-600 mt-2">Plans payants en cours</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Essais gratuits</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.trialSubscriptions}</p>
          <p className="text-sm text-gray-600 mt-2">En période d'essai</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">MRR estimé</h3>
            <CreditCard className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.activeSubscriptions * 29)}
          </p>
          <p className="text-sm text-gray-600 mt-2">Revenu mensuel récurrent</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Gérer les utilisateurs</p>
              <p className="text-sm text-gray-600">Voir tous les comptes</p>
            </div>
          </a>

          <a
            href="/dashboard/admin/organisations"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building2 className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Gérer les organisations</p>
              <p className="text-sm text-gray-600">Clients et abonnements</p>
            </div>
          </a>

          <a
            href="/dashboard/admin/settings"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="w-5 h-5 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Configuration</p>
              <p className="text-sm text-gray-600">Paramètres système</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
