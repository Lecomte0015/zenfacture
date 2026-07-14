import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrganisation } from '@/context/OrganisationContext';
import { useInvoices } from '@/hooks/useInvoices';
import { formatCurrency } from '@/utils/format';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle2, Clock, TrendingUp,
  ArrowUpRight, ArrowDownRight, RefreshCw, Plus, Settings2,
  ClipboardList, Users, Calculator, ShoppingCart, Boxes, Truck,
  Timer, PenSquare, Wallet, Target, BarChart2,
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
import { BUSINESS_PROFILES, type ProfilMetier } from '@/config/businessProfiles';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// ─── StatCard ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
  change: string;
  isPositive: boolean;
  delay?: number;
}

const StatCard = ({ title, value, icon, gradient, shadow, change, isPositive, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={`rounded-2xl p-6 bg-gradient-to-br ${gradient} text-white shadow-lg ${shadow}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-white/70 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
      </div>
      <div className="p-3 bg-white/20 rounded-xl shrink-0 ml-3">
        {icon}
      </div>
    </div>
    <div className="mt-4 flex items-center gap-1 text-sm text-white/80">
      {isPositive
        ? <ArrowUpRight className="w-4 h-4" />
        : <ArrowDownRight className="w-4 h-4" />}
      <span className="font-medium">{change}</span>
      <span className="ml-1 opacity-70">vs mois dernier</span>
    </div>
  </motion.div>
);

// ─── ProfileBanner ───────────────────────────────────────────────────────────
/** Bandeau discret affichant le profil actif + lien pour le changer */
const ProfileBanner = ({ profilMetier }: { profilMetier: ProfilMetier }) => {
  const profile = BUSINESS_PROFILES[profilMetier];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm mb-6"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <profile.icon className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <p className="text-xs text-gray-400 leading-none mb-0.5">Profil actif</p>
          <p className="text-sm font-semibold text-gray-800">{profile.label}</p>
        </div>
      </div>
      <Link
        to="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5" />
        Changer
      </Link>
    </motion.div>
  );
};

// ─── QuickActions ────────────────────────────────────────────────────────────

// Icônes des raccourcis rapides, résolues par route plutôt que dupliquées
// (et incohérentes en emoji) dans chaque profil métier de businessProfiles.ts.
// Une seule source de vérité, alignée sur les icônes déjà utilisées dans la
// Sidebar — évite l'effet "prototype généré" des émojis en grand format.
const QUICK_ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '/dashboard/pos': ShoppingCart,
  '/dashboard/stock': Boxes,
  '/dashboard/commandes-fournisseurs': Truck,
  '/dashboard/invoices': FileText,
  '/dashboard/devis': ClipboardList,
  '/dashboard/time-tracking': Timer,
  '/dashboard/clients': Users,
  '/dashboard/signatures': PenSquare,
  '/dashboard/tva': Calculator,
  '/dashboard/payroll': Wallet,
  '/dashboard/crm': Target,
  '/dashboard/reports': BarChart2,
};

/** Raccourcis rapides adaptés au profil métier */
const QuickActions = ({ profilMetier }: { profilMetier: ProfilMetier | null }) => {
  const fallbackActions = [
    { label: 'Nouvelle facture', href: '/dashboard/invoices', color: 'bg-blue-600',    textColor: 'text-white' },
    { label: 'Nouveau devis',    href: '/dashboard/devis',    color: 'bg-violet-600',  textColor: 'text-white' },
    { label: 'Clients',          href: '/dashboard/clients',  color: 'bg-emerald-600', textColor: 'text-white' },
    { label: 'TVA',              href: '/dashboard/tva',      color: 'bg-amber-500',   textColor: 'text-white' },
  ];
  const actions = profilMetier ? BUSINESS_PROFILES[profilMetier].quickActions : fallbackActions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="mb-8"
    >
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Vos raccourcis
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = QUICK_ACTION_ICONS[action.href] || FileText;
          return (
            <Link
              key={action.href}
              to={action.href}
              className={`${action.color} ${action.textColor} rounded-2xl p-4 flex flex-col items-start gap-2.5 shadow-sm hover:opacity-90 hover:shadow-md transition-all duration-150 group`}
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold leading-tight group-hover:underline">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
};

// ─── DashboardPage ────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { user } = useAuth();
  const { profilMetier } = useOrganisation();
  const { invoices, loading, error, refreshInvoices } = useInvoices({ limit: 200 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshInvoices();
    setIsRefreshing(false);
  };

  // ─── Stats ───────────────────────────────────────────────────────
  const totalInvoices = invoices.length;
  const totalPaid     = invoices.filter(inv => inv.status === 'paid').length;
  const totalPending  = invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length;
  const totalRevenue  = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  // ─── Monthly revenue chart ────────────────────────────────────────
  const monthlyRevenue = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const month = d.getMonth();
      const year  = d.getFullYear();
      const label = format(d, 'MMM', { locale: fr });
      const total = invoices
        .filter(inv => {
          if (inv.status !== 'paid' || !inv.date) return false;
          const dt = new Date(inv.date);
          return dt.getMonth() === month && dt.getFullYear() === year;
        })
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
      return { label: label.charAt(0).toUpperCase() + label.slice(1).replace('.', ''), total };
    });
  }, [invoices]);

  const chartData = {
    labels: monthlyRevenue.map(m => m.label),
    datasets: [
      {
        data: monthlyRevenue.map(m => m.total),
        borderColor: '#ea580c',
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 180);
          gradient.addColorStop(0, 'rgba(234,88,12,0.30)');
          gradient.addColorStop(1, 'rgba(234,88,12,0)');
          return gradient;
        },
        fill: true,
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ea580c',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#292524',
        titleColor: '#a8a29e',
        bodyColor: '#fafaf9',
        padding: 10,
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => " " + formatCurrency(ctx.parsed.y),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#a8a29e', font: { size: 12 } },
        border: { display: false },
      },
      y: { display: false },
    },
  };

  // ─── Greeting ────────────────────────────────────────────────────
  const prenom = (() => {
    const name = (user?.user_metadata?.name as string) || '';
    return name.split(' ')[0] || user?.email?.split('@')[0] || 'vous';
  })();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const todayLabel = new Date().toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {prenom}</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            Voici où en est votre activité ce {todayLabel}.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <Link
            to="/dashboard/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm text-sm font-medium text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle facture
          </Link>
        </div>
      </div>

      {/* ── Bandeau profil ───────────────────────────────────────────── */}
      {profilMetier && <ProfileBanner profilMetier={profilMetier} />}

      {/* ── Actions rapides ──────────────────────────────────────────── */}
      <QuickActions profilMetier={profilMetier} />

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total factures"
          value={totalInvoices.toString()}
          icon={<FileText className="w-5 h-5 text-white" />}
          gradient="from-blue-500 to-blue-700"
          shadow="shadow-blue-500/25"
          change="+2.5%"
          isPositive={true}
          delay={0}
        />
        <StatCard
          title="Factures payées"
          value={totalPaid.toString()}
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
          gradient="from-emerald-500 to-emerald-700"
          shadow="shadow-emerald-500/25"
          change="+5.2%"
          isPositive={true}
          delay={0.08}
        />
        <StatCard
          title="En attente"
          value={totalPending.toString()}
          icon={<Clock className="w-5 h-5 text-white" />}
          gradient="from-amber-500 to-orange-600"
          shadow="shadow-amber-500/25"
          change="-1.8%"
          isPositive={false}
          delay={0.16}
        />
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(totalRevenue)}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          gradient="from-violet-500 to-purple-700"
          shadow="shadow-violet-500/25"
          change="+12.7%"
          isPositive={true}
          delay={0.24}
        />
      </div>

      {/* ── Revenue chart ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.32 }}
        className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Chiffre d'affaires</h2>
            <p className="text-sm text-gray-400 mt-0.5">6 derniers mois</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            Factures payées
          </div>
        </div>
        <div className="h-48">
          <Line data={chartData} options={chartOptions} />
        </div>
      </motion.div>

      {/* ── Recent invoices ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Dernières factures</h2>
          <Link
            to="/dashboard/invoices"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="px-6 py-4 text-sm text-red-600 bg-red-50">
            Un souci est survenu au chargement de vos factures. Réessayez dans un instant.
          </div>
        ) : recentInvoices.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {recentInvoices.map((invoice) => (
              <li key={invoice.id}>
                <Link to={`/dashboard/invoices`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    invoice.status === 'paid'
                      ? 'bg-emerald-400'
                      : invoice.status === 'sent' || invoice.status === 'draft'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {invoice.client_name || 'Client inconnu'}
                    </p>
                    <p className="text-xs text-gray-400">#{invoice.invoice_number || 'N/A'}</p>
                  </div>
                  <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                    invoice.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-700'
                      : invoice.status === 'overdue'
                      ? 'bg-red-50 text-red-700'
                      : invoice.status === 'cancelled'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {invoice.status === 'paid' ? 'Payée'
                      : invoice.status === 'overdue' ? 'En retard'
                      : invoice.status === 'cancelled' ? 'Annulée'
                      : invoice.status === 'sent' ? 'Envoyée'
                      : 'Brouillon'}
                  </span>
                  <p className="hidden md:block text-xs text-gray-400 shrink-0 w-20 text-right">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-CH') : '—'}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 shrink-0 w-24 text-right">
                    {formatCurrency(invoice.total || 0)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Pas encore de facture</h3>
            <p className="text-sm text-gray-400 mt-1 mb-5">Créez la première en quelques clics, on s'occupe du reste.</p>
            <Link
              to="/dashboard/invoices"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle facture
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardPage;
