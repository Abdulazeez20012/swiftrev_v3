import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Patients from './pages/Patients';
import RevenueItems from './pages/RevenueItems';
import AdminPanel from './pages/Admin';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-full opacity-40 space-y-4">
    <h1 className="text-4xl font-black uppercase tracking-tighter">{title}</h1>
    <p className="font-bold text-lg text-primary">Integration in progress for upcoming features</p>
  </div>
);

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
            <Route path="wallet" element={<PlaceholderPage title="Hospital Wallet" />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router >
  );
};

export default App;
