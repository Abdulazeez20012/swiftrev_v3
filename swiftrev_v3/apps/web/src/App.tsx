import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Patients from './pages/Patients';
import RevenueItems from './pages/RevenueItems';
import AdminPanel from './pages/Admin';
import ClaimsDashboard from './pages/ClaimsDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import Finance from './pages/Finance';
import HospitalManagement from './pages/Hospitals';
import UserManagement from './pages/UserManagement';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import Reconciliation from './pages/Reconciliation';
import BillingSheet from './pages/BillingSheet';

// Guard: only allows access to the /hospitals page for super_admin
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    if (!user || user.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="patients" element={<Patients />} />
            <Route path="revenue-items" element={<RevenueItems />} />
            <Route path="billing-sheet" element={<BillingSheet />} />
            <Route path="claims" element={<ClaimsDashboard />} />
            <Route path="security" element={<SecurityDashboard />} />
            <Route path="finance" element={<Finance />} />
            <Route path="hospitals" element={<SuperAdminRoute><HospitalManagement /></SuperAdminRoute>} />
            <Route path="users" element={<UserManagement />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reconciliation" element={<Reconciliation />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
