import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useInvoices } from '@/hooks/useInvoices';
import { formatCurrency } from '@/utils/format';
import { FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle2, Clock, TrendingUp,
  ArrowUpRight, ArrowDownRight, Plus,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { subMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
}

const StatCard = ({ title, value, change, isPositive = true, icon, gradient, shadow }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl p-6 bg-gradient-to-br ${gradient} text-white shadow-lg ${shadow}`}
  >
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-white/70 text-sm font-medium truncate">{title}</p>
        <p className="text-3xl font-bold mt-2 truncate">{value}</p>
      </div>
      <div className="p-3 bg-white/20 rounded-xl flex-shrink-0 ml-3">
        {icon}
      </div>
    </div>
    <div className="mt-4 flex items-center gap-1 text-sm text-white/80">
      {isPositive
        ? <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
        : <ArrowDownRight className="w-4 h-4 flex-shrink-0" />
      }
      <span>{change} vs mois dernier</span>
    </div>
  </motion.div>
);

// ─── DashboardPage ─────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { user } = useAuth();
  const { invoices, loading, error, refreshInvoices } = useInvoices({ limit: 100 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshInvoices();
    setIsRefreshing(false);
  };

  // Statistiques
  const totalInvoices = invoices.length;
  const totalPaid = invoices.filter(inv => inv.status === 'paid').length;
  const totalPending = invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length;
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Graphique CA mensuel — 6 derniers mois
  const monthlyRevenue = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const label = format(d, 'MMM yy', { locale: fr });
      const total = invoices
        .filter(inv =>
          inv.status === 'paid' &&
          new Date(inv.date).getMonth() === d.getMonth() &&
          new Date(inv.date).getFullYear() === d.getFullYear()
        )
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
      return { label, total };
    });
  }, [invoices]);

  const chartData = {
    labels: monthlyRevenue.map(m => m.label),
    datasets: [
      {
        label: 'CA (CHF)',
        data: monthlyRevenue.map(m => m.total),
        fill: true,
        borderColor: '#3b82f6',
        backgroundColor: (ctx: any) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
          gradient.addColorStop(1, 'rgba(59,130,246,0.00)');
          return gradient;
        },
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${formatCurrency(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 12 } },
        border: { display: false },
      },
      y: {
        display: false,
      },
    },
  };

  // Prénom de l'utilisateur
  const prenom = (() => {
    const name = user?.user_metadata?.name || user?.email || '';
    return name.split(/[\s@]+/)[0] || 'vous';
  })();

  const dateAujourdhui = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const dateCapitalized = dateAujourdhui.charAt(0).toUpperCase() + dateAujourdhui.slice(1);

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Bonjour, <span className="font-medium text-gray-700">{prenom}</span> 👋 — {dateCapitalized}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            to="/dashboard/invoices/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle facture
          </Link>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Cards de stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total factures"
          value={totalInvoices.toString()}
          change="+2.5%"
          isPositive
          gradient="from-blue-500 to-blue-700"
          shadow="shadow-blue-500/20"
          icon={<FileText className="w-5 h-5 text-white" />}
        />
        <StatCard
          title="Factures payées"
          value={totalPaid.toString()}
          change="+5.2%"
          isPositive
          gradient="from-emerald-500 to-emerald-700"
          shadow="shadow-emerald-500/20"
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        />
        <StatCard
          title="En attente"
          value={totalPending.toString()}
          change="-1.8%"
          isPositive={false}
          gradient="from-amber-500 to-orange-600"
          shadow="shadow-amber-500/20"
          icon={<Clock className="w-5 h-5 text-white" />}
        />
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(totalRevenue)}
          change="+12.7%"
          isPositive
          gradient="from-violet-500 to-purple-700"
          shadow="shadow-violet-500/20"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Graphique CA mensuel */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">📈 Chiffre d'affaires</h2>
            <p className="text-sm text-gray-500">6 derniers mois — factures payées</p>
          </div>
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="h-48">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Dernières factures */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900">Dernières factures</h2>
          <Link
            to="/dashboard/invoices"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">Erreur lors du chargement des factures. Veuillez réessayer.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {invoices.slice(0, 5).length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {invoices.slice(0, 5).map((invoice) => (
                  <li key={invoice.id}>
                    <Link to={`/dashboard/invoices`} className="block hover:bg-gray-50 transition-colors">
                      <div className="px-5 py-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {invoice.client_name || 'Client inconnu'}
                              </p>
                              <p className="text-xs text-gray-400">
                                #{invoice.invoice_number || 'N/A'} · {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              invoice.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : invoice.status === 'sent'
                                ? 'bg-blue-100 text-blue-700'
                                : invoice.status === 'overdue'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {invoice.status === 'paid' ? 'Payée' : invoice.status === 'sent' ? 'Envoyée' : invoice.status === 'overdue' ? 'En retard' : 'Brouillon'}
                            </span>
                            <p className="text-sm font-semibold text-gray-900 min-w-[70px] text-right">
                              {formatCurrency(invoice.total || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Aucune facture</h3>
                <p className="mt-1 text-sm text-gray-500">Commencez par créer votre première facture.</p>
                <Link
                  to="/dashboard/invoices/new"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle facture
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
