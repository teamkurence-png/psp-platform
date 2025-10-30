import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { UserRole } from './types/index';
import AuthInitializer from './components/AuthInitializer';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PaymentRequests from './pages/PaymentRequests';
import CreatePaymentRequest from './pages/CreatePaymentRequest';
import MerchantProfile from './pages/MerchantProfile';
import PaymentRequestDetail from './pages/PaymentRequestDetail';
import Balances from './pages/Balances';
import Withdrawals from './pages/Withdrawals';
import CreateWithdrawal from './pages/CreateWithdrawal';
import WithdrawalDetail from './pages/WithdrawalDetail';
import Merchants from './pages/Merchants';
import ManualPay from './pages/ManualPay';
import Settings from './pages/Settings';
import AdminUsers from './pages/AdminUsers';
import BankAccounts from './pages/BankAccounts';
import FormSubmissions from './pages/FormSubmissions';
import PSPPaymentForm from './pages/PSPPaymentForm';
import PSPPaymentStatus from './pages/PSPPaymentStatus';
import { ApiKeys } from './pages/ApiKeys';

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed (if allowedRoles is specified)
  if (allowedRoles && user.role && !allowedRoles.includes(user.role as UserRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public PSP payment routes */}
            <Route path="/pay/:token" element={<PSPPaymentForm />} />
            <Route path="/pay/:token/status" element={<PSPPaymentStatus />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
          </Route>

          <Route
            path="/payment-requests"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PaymentRequests />} />
            <Route path="new" element={<CreatePaymentRequest />} />
            <Route path=":id" element={<PaymentRequestDetail />} />
          </Route>

          <Route
            path="/confirmations"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OPS, UserRole.FINANCE]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManualPay />} />
          </Route>

          <Route
            path="/balances"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Balances />} />
          </Route>

          <Route
            path="/withdrawals"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Withdrawals />} />
            <Route path="new" element={<CreateWithdrawal />} />
            <Route path=":id" element={<WithdrawalDetail />} />
          </Route>

          <Route
            path="/merchants"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OPS, UserRole.FINANCE]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Merchants />} />
          </Route>

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Settings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="bank-accounts" element={<BankAccounts />} />
            <Route path="profile" element={<MerchantProfile />} />
          </Route>

          <Route
            path="/api-keys"
            element={
              <ProtectedRoute allowedRoles={[UserRole.MERCHANT]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ApiKeys />} />
          </Route>

          <Route
            path="/form-submissions"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<FormSubmissions />} />
          </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthInitializer>
    </QueryClientProvider>
  );
}

export default App;
