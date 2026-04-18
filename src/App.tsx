import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalAuthProvider, usePortalAuth } from './contexts/PortalAuthContext';
import LoginPage from './pages/login/page';
import MfaSetupPage from './pages/mfa-setup/page';
import AgendaPage from './pages/agenda/page';
import FaturamentoPage from './pages/faturamento/page';
import RelatoriosPage from './pages/relatorios/page';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = usePortalAuth();

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <i className="ri-loader-4-line animate-spin text-4xl text-teal-600"></i>
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  if (state === 'unauthenticated') return <Navigate to="/login" replace />;
  if (state === 'needs-mfa') return <Navigate to="/mfa" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { state } = usePortalAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={state === 'authenticated' ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/mfa"
        element={state === 'authenticated' ? <Navigate to="/" replace /> : <MfaSetupPage />}
      />
      <Route
        path="/"
        element={<ProtectedRoute><AgendaPage /></ProtectedRoute>}
      />
      <Route
        path="/faturamento"
        element={<ProtectedRoute><FaturamentoPage /></ProtectedRoute>}
      />
      <Route
        path="/relatorios"
        element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <PortalAuthProvider>
      <AppRoutes />
    </PortalAuthProvider>
  );
}
