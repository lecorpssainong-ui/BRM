import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/i18n';
import { Toaster } from '@/components/ui/toaster';
import ThemeApplier from '@/components/ThemeApplier';
import ScrollToTop from '@/components/ScrollToTop';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PageNotFound from '@/lib/PageNotFound';
import AuthModal from '@/components/auth/AuthModal';

// Client shell & pages
import ClientLayout from '@/components/client/ClientLayout';
import Home from '@/pages/client/Home';
import Appointments from '@/pages/client/Appointments';
import Messages from '@/pages/client/Messages';
import Shop from '@/pages/client/Shop';
import Discover from '@/pages/client/Discover';
import OrderHistory from '@/pages/client/OrderHistory';
import Advisor from '@/pages/client/Advisor';
import ClinicalAnamnesis from '@/pages/client/ClinicalAnamnesis';
import HealthHub from '@/pages/client/HealthHub';

// Staff Cockpit
import StaffApp from '@/pages/staff/StaffApp';

// Auth pages
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  useEffect(() => {
    if (authError && authError.type === 'auth_required') {
      navigateToLogin();
    }
  }, [authError, navigateToLogin]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-sand">
        <div className="w-10 h-10 border-4 border-cacao/20 border-t-cacao rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-sand">
          <div className="w-10 h-10 border-4 border-cacao/20 border-t-cacao rounded-full animate-spin"></div>
        </div>
      );
    }
  }

  return (
    <>
      <ThemeApplier />
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Client Routes inside ClientLayout */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rendez-vous" element={<Appointments />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/boutique" element={<Shop />} />
          <Route path="/decouvertes" element={<Discover />} />
          <Route path="/outils-sante" element={<HealthHub />} />
          <Route path="/bilan-sante" element={<HealthHub />} />
          <Route path="/anamnese" element={<ClinicalAnamnesis />} />
          <Route path="/bilan-vitalite" element={<ClinicalAnamnesis />} />
          <Route path="/historique-commandes" element={<OrderHistory />} />
        </Route>

        {/* Standalone Full-Screen Advisor Page (Independent of app Header and BottomNav) */}
        <Route path="/conseiller-ia" element={<Advisor />} />

        {/* Staff Cockpit routes */}
        <Route path="/staff" element={<StaffApp />} />
        <Route path="/espace-pro" element={<StaffApp />} />
        <Route path="/gestion-massages" element={<StaffApp initialSection="services" />} />
        <Route path="/validation-paiements" element={<StaffApp initialSection="payments" />} />
        <Route path="/statistiques-globales" element={<StaffApp initialSection="stats" />} />
        <Route path="/journal-activite" element={<StaffApp initialSection="activity" />} />

        {/* 404 */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <AuthModal />
        </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}
