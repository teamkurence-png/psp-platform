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
              <Route path="transactions" element={<Transactions />} />
              <Route path="confirmations" element={<div className="text-2xl font-bold">Manual Confirmations - Coming Soon</div>} />
              <Route path="balances" element={<div className="text-2xl font-bold">Balances - Coming Soon</div>} />
              <Route path="withdrawals" element={<div className="text-2xl font-bold">Crypto Withdrawals - Coming Soon</div>} />
              <Route path="customers" element={<div className="text-2xl font-bold">Customers - Coming Soon</div>} />
              <Route path="settings" element={<div className="text-2xl font-bold">Settings - Coming Soon</div>} />
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
