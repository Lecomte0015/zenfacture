import { supabase } from '@/lib/supabaseClient';

export interface MonthPoint {
  month: string; // format 'YYYY-MM'
  label: string; // format lisible ex: 'juil. 2026'
  value: number;
}

export interface PlanDistributionPoint {
  plan: string;
  label: string;
  count: number;
}

export interface AdminReportsData {
  revenueByMonth: MonthPoint[];
  planDistribution: PlanDistributionPoint[];
  newClientsByMonth: MonthPoint[];
  churnRateByMonth: MonthPoint[];
}

const MONTHS_WINDOW = 6;

const PLAN_LABELS: Record<string, string> = {
  essentiel: 'Essentiel',
  pro: 'Professionnel',
  entreprise: 'Entreprise',
};

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1));
};

/** Génère les N derniers mois (clé + label), du plus ancien au plus récent. */
const lastNMonths = (n: number): string[] => {
  const now = new Date();
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  return months;
};

/**
 * Agrège revenu, répartition des plans, nouveaux clients et churn pour la
 * page AdminReportsPage. Tout est calculé côté client à partir de requêtes
 * simples (pas de RPC dédiée) : le volume de données d'un back-office SMB
 * reste largement gérable sans agrégation SQL.
 */
export const getAdminReportsData = async (): Promise<AdminReportsData> => {
  const months = lastNMonths(MONTHS_WINDOW);
  const windowStart = new Date();
  windowStart.setMonth(windowStart.getMonth() - (MONTHS_WINDOW - 1));
  windowStart.setDate(1);
  windowStart.setHours(0, 0, 0, 0);

  // ── Revenu mensuel (factures payées) ────────────────────────────────
  const { data: paidInvoices, error: invoicesError } = await supabase
    .from('factures')
    .select('total, date')
    .eq('status', 'paid')
    .gte('date', windowStart.toISOString());

  if (invoicesError) {
    console.error('Erreur lors du chargement des factures pour les rapports :', invoicesError);
  }

  const revenueMap = new Map<string, number>(months.map((m) => [m, 0]));
  (paidInvoices || []).forEach((inv: any) => {
    if (!inv.date) return;
    const key = monthKey(new Date(inv.date));
    if (revenueMap.has(key)) {
      revenueMap.set(key, (revenueMap.get(key) || 0) + (inv.total || 0));
    }
  });

  const revenueByMonth: MonthPoint[] = months.map((m) => ({
    month: m,
    label: monthLabel(m),
    value: revenueMap.get(m) || 0,
  }));

  // ── Répartition des plans (abonnements actifs) ──────────────────────
  const { data: activeProfiles, error: profilesError } = await supabase
    .from('profils')
    .select('plan_abonnement')
    .eq('subscription_status', 'active');

  if (profilesError) {
    console.error('Erreur lors du chargement des profils pour les rapports :', profilesError);
  }

  const planCounts = new Map<string, number>();
  (activeProfiles || []).forEach((p: any) => {
    const plan = p.plan_abonnement || 'essentiel';
    planCounts.set(plan, (planCounts.get(plan) || 0) + 1);
  });

  const planDistribution: PlanDistributionPoint[] = Array.from(planCounts.entries()).map(([plan, count]) => ({
    plan,
    label: PLAN_LABELS[plan] || plan,
    count,
  }));

  // ── Nouveaux clients par mois (inscriptions) ────────────────────────
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profils')
    .select('created_at, subscription_status, updated_at')
    .gte('created_at', windowStart.toISOString());

  if (allProfilesError) {
    console.error('Erreur lors du chargement des inscriptions pour les rapports :', allProfilesError);
  }

  const clientsMap = new Map<string, number>(months.map((m) => [m, 0]));
  (allProfiles || []).forEach((p: any) => {
    if (!p.created_at) return;
    const key = monthKey(new Date(p.created_at));
    if (clientsMap.has(key)) {
      clientsMap.set(key, (clientsMap.get(key) || 0) + 1);
    }
  });

  const newClientsByMonth: MonthPoint[] = months.map((m) => ({
    month: m,
    label: monthLabel(m),
    value: clientsMap.get(m) || 0,
  }));

  // ── Taux de churn mensuel (approximation) ───────────────────────────
  // Il n'existe pas de table d'historique des changements d'abonnement
  // dans ce projet : on ne peut donc pas connaître avec certitude le
  // nombre d'abonnés actifs au DÉBUT de chaque mois passé. Approximation
  // retenue : nombre de profils passés à 'canceled' dans le mois (via
  // updated_at) rapporté au nombre total de profils ayant un abonnement
  // payant actif aujourd'hui — un ordre de grandeur utile, pas une mesure
  // comptable exacte.
  const { count: totalPayingCount } = await supabase
    .from('profils')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active');

  const { data: canceledProfiles, error: canceledError } = await supabase
    .from('profils')
    .select('updated_at')
    .eq('subscription_status', 'canceled')
    .gte('updated_at', windowStart.toISOString());

  if (canceledError) {
    console.error('Erreur lors du chargement des résiliations pour les rapports :', canceledError);
  }

  const canceledMap = new Map<string, number>(months.map((m) => [m, 0]));
  (canceledProfiles || []).forEach((p: any) => {
    if (!p.updated_at) return;
    const key = monthKey(new Date(p.updated_at));
    if (canceledMap.has(key)) {
      canceledMap.set(key, (canceledMap.get(key) || 0) + 1);
    }
  });

  const base = Math.max(totalPayingCount || 0, 1);
  const churnRateByMonth: MonthPoint[] = months.map((m) => ({
    month: m,
    label: monthLabel(m),
    value: Math.round(((canceledMap.get(m) || 0) / base) * 1000) / 10, // %, 1 décimale
  }));

  return { revenueByMonth, planDistribution, newClientsByMonth, churnRateByMonth };
};
