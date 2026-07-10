import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingDown } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getAdminReportsData, AdminReportsData } from '@/services/adminReportsService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PLAN_COLORS: Record<string, string> = {
  essentiel: '#93c5fd',
  pro: '#2563eb',
  entreprise: '#1e3a8a',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount);

const AdminReportsPage: React.FC = () => {
  const [data, setData] = useState<AdminReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const result = await getAdminReportsData();
        setData(result);
      } catch (error) {
        console.error('Erreur lors du chargement des rapports :', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalRevenue = data.revenueByMonth.reduce((sum, p) => sum + p.value, 0);
  const totalNewClients = data.newClientsByMonth.reduce((sum, p) => sum + p.value, 0);
  const latestChurn = data.churnRateByMonth[data.churnRateByMonth.length - 1]?.value ?? 0;

  const revenueChart = {
    labels: data.revenueByMonth.map((p) => p.label),
    datasets: [
      {
        label: 'Revenu (CHF)',
        data: data.revenueByMonth.map((p) => p.value),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const clientsChart = {
    labels: data.newClientsByMonth.map((p) => p.label),
    datasets: [
      {
        label: 'Nouveaux clients',
        data: data.newClientsByMonth.map((p) => p.value),
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
    ],
  };

  const churnChart = {
    labels: data.churnRateByMonth.map((p) => p.label),
    datasets: [
      {
        label: 'Taux de churn (%)',
        data: data.churnRateByMonth.map((p) => p.value),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.15)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const planChart = {
    labels: data.planDistribution.map((p) => p.label),
    datasets: [
      {
        data: data.planDistribution.map((p) => p.count),
        backgroundColor: data.planDistribution.map((p) => PLAN_COLORS[p.plan] || '#9ca3af'),
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="w-7 h-7 mr-3 text-gray-700" />
          Rapports &amp; Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Revenu, répartition des plans, croissance et churn — 6 derniers mois
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Revenu (6 mois)</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Nouveaux clients (6 mois)</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalNewClients}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Churn du mois</p>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{latestChurn}%</p>
          <p className="text-xs text-gray-400 mt-1">Estimation — voir note dans le graphique ci-dessous</p>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenu mensuel</h3>
          <Line data={revenueChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des plans (abonnements actifs)</h3>
          {data.planDistribution.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center">Aucun abonnement payant actif pour le moment</p>
          ) : (
            <Pie data={planChart} options={{ responsive: true }} />
          )}
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouveaux clients / mois</h3>
          <Bar data={clientsChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Taux de churn / mois (estimation)</h3>
          <Line data={churnChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          <p className="text-xs text-gray-400 mt-3">
            Approximation : résiliations du mois rapportées aux abonnements payants actuels.
            L'absence d'un historique complet des abonnements ne permet pas un calcul exact
            (nombre d'abonnés actifs au début de chaque mois passé).
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
