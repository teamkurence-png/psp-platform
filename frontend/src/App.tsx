import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/auth';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PaymentRequests from './pages/PaymentRequests';
import CreatePaymentRequest from './pages/CreatePaymentRequest';
import Transactions from './pages/Transactions';
import MerchantProfile from './pages/MerchantProfile';
import PaymentRequestDetail from './pages/PaymentRequestDetail';
import TransactionDetail from './pages/TransactionDetail';
import Balances from './pages/Balances';
import Withdrawals from './pages/Withdrawals';
import CreateWithdrawal from './pages/CreateWithdrawal';
import Merchants from './pages/Merchants';
import ManualConfirmations from './pages/ManualConfirmations';
import Settings from './pages/Settings';
import AdminUsers from './pages/AdminUsers';
import BankAccounts from './pages/BankAccounts';
import Cards from './pages/Cards';

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="payment-requests" element={<PaymentRequests />} />
              <Route path="payment-requests/new" element={<CreatePaymentRequest />} />
              <Route path="payment-requests/:id" element={<PaymentRequestDetail />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="transactions/:id" element={<TransactionDetail />} />
              <Route path="confirmations" element={<ManualConfirmations />} />
              <Route path="balances" element={<Balances />} />
              <Route path="withdrawals" element={<Withdrawals />} />
              <Route path="withdrawals/new" element={<CreateWithdrawal />} />
              <Route path="merchants" element={<Merchants />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/users" element={<AdminUsers />} />
              <Route path="settings/bank-accounts" element={<BankAccounts />} />
              <Route path="settings/cards" element={<Cards />} />
              <Route path="settings/profile" element={<MerchantProfile />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
