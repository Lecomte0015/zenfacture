import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import MfaChallenge from '@/components/auth/MfaChallenge';
import AdminRoute from '@/components/auth/AdminRoute';

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import AdminLayout from '@/layouts/AdminLayout';

// Components
import FeatureGuard from '@/components/common/FeatureGuard';
import CookieBanner from '@/components/common/CookieBanner';

// Lazy loaded public pages
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('@/pages/ResetPasswordPage'));
const FeaturesPage = React.lazy(() => import('@/pages/FeaturesPage'));
const HelpPage = React.lazy(() => import('@/pages/HelpPage'));
const PricingPage = React.lazy(() => import('@/pages/PricingPage'));
const DocumentationPage = React.lazy(() => import('@/pages/DocumentationPage'));
const FaqPage = React.lazy(() => import('@/pages/FaqPage'));
const CguPage = React.lazy(() => import('@/pages/CguPage'));
const ConfidentialitePage = React.lazy(() => import('@/pages/ConfidentialitePage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));

// Lazy loaded dashboard pages
const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage'));
const BillingPage = React.lazy(() => import('@/pages/BillingPage'));
const BillingSuccessPage = React.lazy(() => import('@/pages/BillingSuccessPage'));
const BillingCancelPage = React.lazy(() => import('@/pages/BillingCancelPage'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const SupportPage = React.lazy(() => import('@/pages/SupportPage'));
const InvoicesPage = React.lazy(() => import('@/pages/dashboard/InvoicesPage'));
const ExpensesPage = React.lazy(() => import('@/pages/dashboard/ExpensesPage'));
const ReportsPage = React.lazy(() => import('@/pages/dashboard/ReportsPage'));
const ClientsPage = React.lazy(() => import('@/pages/dashboard/ClientsPage'));
const TeamPage = React.lazy(() => import('@/pages/dashboard/TeamPage'));
const TeamInvitePage = React.lazy(() => import('@/pages/dashboard/TeamInvitePage'));
const ApiPage = React.lazy(() => import('@/pages/dashboard/ApiPage'));
const RemindersPage = React.lazy(() => import('@/pages/dashboard/RemindersPage'));

// Admin pages
const AdminLoginPage = React.lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsersPage = React.lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminOrganisationsPage = React.lazy(() => import('@/pages/admin/AdminOrganisationsPage'));
const AdminRemindersPage = React.lazy(() => import('@/pages/admin/AdminRemindersPage'));
const AdminSettingsPage = React.lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminReportsPage = React.lazy(() => import('@/pages/admin/AdminReportsPage'));
const AdminAuditLogPage = React.lazy(() => import('@/pages/admin/AdminAuditLogPage'));

const TimeTrackingPage = React.lazy(() => import('@/pages/dashboard/TimeTrackingPage'));
const PayrollPage = React.lazy(() => import('@/pages/dashboard/PayrollPage'));
const ProduitsPage = React.lazy(() => import('@/pages/dashboard/ProduitsPage'));
const DevisPage = React.lazy(() => import('@/pages/dashboard/DevisPage'));
const AvoirsPage = React.lazy(() => import('@/pages/dashboard/AvoirsPage'));
const RecurrencesPage = React.lazy(() => import('@/pages/dashboard/RecurrencesPage'));
const ArchivePage = React.lazy(() => import('@/pages/dashboard/ArchivePage'));
const BatchInvoicePage = React.lazy(() => import('@/pages/dashboard/BatchInvoicePage'));
const StockPage = React.lazy(() => import('@/pages/dashboard/StockPage'));
const TaxEstimationPage = React.lazy(() => import('@/pages/dashboard/TaxEstimationPage'));
const MarquesPage = React.lazy(() => import('@/pages/dashboard/MarquesPage'));
// Phase 7 pages
const PostalPage = React.lazy(() => import('@/pages/dashboard/PostalPage'));
const FraudDetectionPage = React.lazy(() => import('@/pages/dashboard/FraudDetectionPage'));
const AuditTrailPage = React.lazy(() => import('@/pages/dashboard/AuditTrailPage'));
const POSPage = React.lazy(() => import('@/pages/dashboard/POSPage'));
const BoutiquePage = React.lazy(() => import('@/pages/dashboard/BoutiquePage'));
// Phase 8 pages
const PortailClientAdminPage = React.lazy(() => import('@/pages/dashboard/PortailClientAdminPage'));
const CRMPage = React.lazy(() => import('@/pages/dashboard/CRMPage'));
const CommandesFournisseursPage = React.lazy(() => import('@/pages/dashboard/CommandesFournisseursPage'));
// Pages publiques Phase 8
const PortailClientPage = React.lazy(() => import('@/pages/PortailClientPage'));
const SignaturePage = React.lazy(() => import('@/pages/SignaturePage'));
const SignaturesDashboardPage = React.lazy(() => import('@/pages/dashboard/SignaturesDashboardPage'));
// Phase 3 pages
const BankingPage = React.lazy(() => import('@/pages/dashboard/BankingPage'));
const ComptabilitePage = React.lazy(() => import('@/pages/dashboard/ComptabilitePage'));
const TvaPage = React.lazy(() => import('@/pages/dashboard/TvaPage'));
const EbillPage = React.lazy(() => import('@/pages/dashboard/EbillPage'));
const FiduciairePage = React.lazy(() => import('@/pages/dashboard/FiduciairePage'));
const ImportPage = React.lazy(() => import('@/pages/dashboard/ImportPage'));
const FiduciairePortal = React.lazy(() => import('@/pages/fiduciaire/FiduciairePortal'));

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  // Ne pas bloquer l'affichage si loading prend trop de temps
  const [showContent, setShowContent] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1000); // Après 1 seconde, afficher le contenu même si loading

    return () => clearTimeout(timer);
  }, []);

  // ── Double authentification (AAL2) ────────────────────────────────────────
  // Supabase ouvre une session dès que le mot de passe est validé (AAL1),
  // même si l'utilisateur a activé la 2FA. Sans ce contrôle, la 2FA activée
  // depuis Mon Profil ne protégerait jamais réellement la connexion : c'est
  // à l'application de bloquer l'accès tant que le second facteur n'a pas
  // été vérifié.
  const [mfaCheck, setMfaCheck] = React.useState<'checking' | 'required' | 'satisfied'>('checking');
  const [mfaFactorId, setMfaFactorId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error || !data) {
          if (!cancelled) setMfaCheck('satisfied');
          return;
        }
        if (data.nextLevel === 'aal2' && data.currentLevel !== data.nextLevel) {
          const { data: factorsData } = await supabase.auth.mfa.listFactors();
          const totp = factorsData?.totp?.find(f => f.status === 'verified');
          if (!cancelled) {
            setMfaFactorId(totp?.id ?? null);
            setMfaCheck('required');
          }
        } else if (!cancelled) {
          setMfaCheck('satisfied');
        }
      } catch {
        if (!cancelled) setMfaCheck('satisfied');
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  if (loading && !showContent) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: window.location.pathname }} replace />;
  }

  if (mfaCheck === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (mfaCheck === 'required') {
    return <MfaChallenge factorId={mfaFactorId} onVerified={() => setMfaCheck('satisfied')} />;
  }

  return <>{children}</>;
};

// Public Only Route Component
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Lazy loading wrappers
const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>
  }>
    {children}
  </React.Suspense>
);

// Lazy load avec skeleton pour le dashboard
const DashboardSkeleton = React.lazy(() => import('@/components/common/DashboardSkeleton'));
const LazyLoadDashboard = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={
    <React.Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
      <DashboardSkeleton />
    </React.Suspense>
  }>
    {children}
  </React.Suspense>
);

function App() {
  return (
    <>
    <CookieBanner />
    <Routes>
      {/* Public Routes with PublicLayout */}
      <Route element={<PublicLayout><Outlet /></PublicLayout>}>
        <Route path="/" element={<LazyLoad><HomePage /></LazyLoad>} />
        <Route path="/fonctionnalites" element={<LazyLoad><FeaturesPage /></LazyLoad>} />
        <Route path="/tarifs" element={<LazyLoad><PricingPage /></LazyLoad>} />
        <Route path="/aide" element={<LazyLoad><HelpPage /></LazyLoad>} />
        <Route path="/documentation" element={<LazyLoad><DocumentationPage /></LazyLoad>} />
        <Route path="/faq" element={<LazyLoad><FaqPage /></LazyLoad>} />
        <Route path="/cgu" element={<LazyLoad><CguPage /></LazyLoad>} />
        <Route path="/confidentialite" element={<LazyLoad><ConfidentialitePage /></LazyLoad>} />

        {/* Auth Routes */}
        <Route path="/auth/login" element={
          <PublicOnlyRoute>
            <LazyLoad><LoginPage /></LazyLoad>
          </PublicOnlyRoute>
        } />
        <Route path="/auth/register" element={
          <PublicOnlyRoute>
            <LazyLoad><RegisterPage /></LazyLoad>
          </PublicOnlyRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicOnlyRoute>
            <LazyLoad><ForgotPasswordPage /></LazyLoad>
          </PublicOnlyRoute>
        } />
        <Route path="/reset-password" element={
          <PublicOnlyRoute>
            <LazyLoad><ResetPasswordPage /></LazyLoad>
          </PublicOnlyRoute>
        } />
      </Route>

      {/* Protected Dashboard Routes with DashboardLayout */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout>
            <Outlet />
          </DashboardLayout>
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<LazyLoadDashboard><DashboardPage /></LazyLoadDashboard>} />
        <Route path="/dashboard/invoices" element={<LazyLoad><InvoicesPage /></LazyLoad>} />
        <Route path="/invoices/new" element={<LazyLoad><InvoicesPage newInvoice /></LazyLoad>} />
        <Route path="/dashboard/clients" element={<LazyLoad><ClientsPage newClient={false} /></LazyLoad>} />
        <Route path="/clients/new" element={<LazyLoad><ClientsPage newClient={true} /></LazyLoad>} />
        <Route path="/dashboard/produits" element={<LazyLoad><ProduitsPage /></LazyLoad>} />
        <Route path="/dashboard/devis" element={<LazyLoad><DevisPage /></LazyLoad>} />
        <Route path="/dashboard/avoirs" element={<LazyLoad><AvoirsPage /></LazyLoad>} />
        <Route path="/dashboard/recurrences" element={<LazyLoad><RecurrencesPage /></LazyLoad>} />
        <Route path="/dashboard/archive" element={<LazyLoad><ArchivePage /></LazyLoad>} />
        <Route path="/dashboard/batch-invoice" element={<LazyLoad><BatchInvoicePage /></LazyLoad>} />
        <Route path="/dashboard/stock" element={<LazyLoad><StockPage /></LazyLoad>} />
        <Route path="/dashboard/tax-estimation" element={<LazyLoad><TaxEstimationPage /></LazyLoad>} />
        <Route path="/dashboard/marques" element={<LazyLoad><MarquesPage /></LazyLoad>} />
        <Route path="/dashboard/postal" element={<LazyLoad><PostalPage /></LazyLoad>} />
        <Route path="/dashboard/fraud-detection" element={<LazyLoad><FraudDetectionPage /></LazyLoad>} />
        <Route path="/dashboard/audit-trail" element={<LazyLoad><AuditTrailPage /></LazyLoad>} />
        <Route path="/dashboard/pos" element={<LazyLoad><POSPage /></LazyLoad>} />
        <Route path="/dashboard/boutique" element={<LazyLoad><BoutiquePage /></LazyLoad>} />
        {/* Phase 8 routes */}
        <Route path="/dashboard/portail-client" element={<LazyLoad><PortailClientAdminPage /></LazyLoad>} />
        <Route path="/dashboard/crm" element={<LazyLoad><CRMPage /></LazyLoad>} />
        <Route path="/dashboard/commandes-fournisseurs" element={<LazyLoad><CommandesFournisseursPage /></LazyLoad>} />
        <Route path="/dashboard/signatures" element={<LazyLoad><SignaturesDashboardPage /></LazyLoad>} />
        <Route path="/dashboard/banking" element={<LazyLoad><BankingPage /></LazyLoad>} />
        <Route path="/dashboard/comptabilite" element={
          <FeatureGuard requiredFeature="comptabilite">
            <LazyLoad><ComptabilitePage /></LazyLoad>
          </FeatureGuard>
        } />
        <Route path="/dashboard/tva" element={<LazyLoad><TvaPage /></LazyLoad>} />
        <Route path="/dashboard/ebill" element={<LazyLoad><EbillPage /></LazyLoad>} />
        <Route path="/dashboard/fiduciaire" element={<LazyLoad><FiduciairePage /></LazyLoad>} />
        <Route path="/dashboard/import" element={<LazyLoad><ImportPage /></LazyLoad>} />
        <Route path="/dashboard/time-tracking" element={<LazyLoad><TimeTrackingPage /></LazyLoad>} />
        <Route path="/dashboard/payroll" element={<LazyLoad><PayrollPage /></LazyLoad>} />
        <Route path="/dashboard/team" element={
          <LazyLoad>
            <TeamPage />
          </LazyLoad>
        } />
        <Route path="/dashboard/team/invite" element={
          <LazyLoad>
            <TeamInvitePage />
          </LazyLoad>
        } />
        <Route path="/dashboard/expenses" element={
          <FeatureGuard requiredFeature="expenses">
            <LazyLoad><ExpensesPage /></LazyLoad>
          </FeatureGuard>
        } />
        <Route path="/dashboard/reports" element={
          <FeatureGuard requiredFeature="reports">
            <LazyLoad><ReportsPage /></LazyLoad>
          </FeatureGuard>
        } />
        <Route path="/dashboard/api" 
          element={
            <FeatureGuard requiredFeature="api">
              <LazyLoad><ApiPage /></LazyLoad>
            </FeatureGuard>
          } 
        />
        <Route path="/dashboard/billing" element={<LazyLoad><BillingPage /></LazyLoad>} />
        <Route path="/dashboard/billing/success" element={<LazyLoad><BillingSuccessPage /></LazyLoad>} />
        <Route path="/dashboard/billing/cancel" element={<LazyLoad><BillingCancelPage /></LazyLoad>} />
        {/* Le support de base est accessible à tous les plans — seul le
            traitement "prioritaire" est réservé aux plans payants supérieurs
            (géré à l'intérieur de SupportPage, pas par un blocage de route). */}
        <Route
          path="/dashboard/support"
          element={<LazyLoad><SupportPage /></LazyLoad>}
        />
        <Route path="/dashboard/profile" element={<LazyLoad><ProfilePage /></LazyLoad>} />
        <Route path="/dashboard/settings" element={<LazyLoad><SettingsPage /></LazyLoad>} />
        <Route path="/dashboard/rappels" element={<LazyLoad><RemindersPage /></LazyLoad>} />
      </Route>

      {/* Admin Login (separate from regular login) */}
      <Route path="/admin/login" element={<LazyLoad><AdminLoginPage /></LazyLoad>} />

      {/* Admin Back-Office Routes (Super Admin only) — ProtectedRoute vérifie
          l'authentification + 2FA, AdminRoute vérifie le rôle admin/super_admin
          (voir components/auth/AdminRoute.tsx pour le contexte de cette faille) */}
      <Route element={
        <ProtectedRoute>
          <AdminRoute>
            <AdminLayout>
              <Outlet />
            </AdminLayout>
          </AdminRoute>
        </ProtectedRoute>
      }>
        <Route path="/dashboard/admin" element={<LazyLoad><AdminDashboard /></LazyLoad>} />
        <Route path="/dashboard/admin/users" element={<LazyLoad><AdminUsersPage /></LazyLoad>} />
        <Route path="/dashboard/admin/organisations" element={<LazyLoad><AdminOrganisationsPage /></LazyLoad>} />
        <Route path="/dashboard/admin/rappels" element={<LazyLoad><AdminRemindersPage /></LazyLoad>} />
        <Route path="/dashboard/admin/settings" element={<LazyLoad><AdminSettingsPage /></LazyLoad>} />
        <Route path="/dashboard/admin/reports" element={<LazyLoad><AdminReportsPage /></LazyLoad>} />
        <Route path="/dashboard/admin/logs" element={<LazyLoad><AdminAuditLogPage /></LazyLoad>} />
      </Route>

      {/* Fiduciary Portal (public route with token) */}
      <Route path="/fiduciaire/:token" element={<LazyLoad><FiduciairePortal /></LazyLoad>} />

      {/* Phase 8 — Pages publiques sans auth */}
      <Route path="/portail/:token" element={<LazyLoad><PortailClientPage /></LazyLoad>} />
      <Route path="/signer/:token" element={<LazyLoad><SignaturePage /></LazyLoad>} />

      {/* Redirect old routes to new ones */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/register" element={<Navigate to="/auth/register" replace />} />
      
      {/* 404 Route - Must be the last route */}
      <Route path="*" element={<LazyLoad><NotFoundPage /></LazyLoad>} />
    </Routes>
    </>
  );
};

export default App;