import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

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

// Admin pages
const AdminLoginPage = React.lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsersPage = React.lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminOrganisationsPage = React.lazy(() => import('@/pages/admin/AdminOrganisationsPage'));
const AdminRemindersPage = React.lazy(() => import('@/pages/admin/AdminRemindersPage'));
const AdminSettingsPage = React.lazy(() => import('@/pages/admin/AdminSettingsPage'));

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
        <Route path="/dashboard/banking" element={<LazyLoad><BankingPage /></LazyLoad>} />
        <Route path="/dashboard/comptabilite" element={<LazyLoad><ComptabilitePage /></LazyLoad>} />
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
        <Route
          path="/dashboard/support"
          element={
            <FeatureGuard requiredFeature="supportPrioritaire" redirectTo="/dashboard/billing">
              <LazyLoad><SupportPage /></LazyLoad>
            </FeatureGuard>
          }
        />
        <Route path="/dashboard/profile" element={<LazyLoad><ProfilePage /></LazyLoad>} />
        <Route path="/dashboard/settings" element={<LazyLoad><SettingsPage /></LazyLoad>} />
      </Route>

      {/* Admin Login (separate from regular login) */}
      <Route path="/admin/login" element={<LazyLoad><AdminLoginPage /></LazyLoad>} />

      {/* Admin Back-Office Routes (Super Admin only) */}
      <Route element={
        <ProtectedRoute>
          <AdminLayout>
            <Outlet />
          </AdminLayout>
        </ProtectedRoute>
      }>
        <Route path="/dashboard/admin" element={<LazyLoad><AdminDashboard /></LazyLoad>} />
        <Route path="/dashboard/admin/users" element={<LazyLoad><AdminUsersPage /></LazyLoad>} />
        <Route path="/dashboard/admin/organisations" element={<LazyLoad><AdminOrganisationsPage /></LazyLoad>} />
        <Route path="/dashboard/admin/rappels" element={<LazyLoad><AdminRemindersPage /></LazyLoad>} />
        <Route path="/dashboard/admin/settings" element={<LazyLoad><AdminSettingsPage /></LazyLoad>} />
      </Route>

      {/* Fiduciary Portal (public route with token) */}
      <Route path="/fiduciaire/:token" element={<LazyLoad><FiduciairePortal /></LazyLoad>} />

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