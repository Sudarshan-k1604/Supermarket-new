import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import CustomerPOSPage from './pages/CustomerPOSPage';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';
import Dashboard1 from './pages/Dashboard1';
import CustomerDashboard from './pages/d1';
import { ProfilePage } from './pages/ProfilePage';
import UpdatePassword from './pages/UpdatePassword';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAdmin, session } = useAuth();

  const SalesRoute = () => (isAdmin ? <Sales /> : <CustomerPOSPage />);
  const DashboardRoute = () => (isAdmin ? <Dashboard /> : <CustomerDashboard />);

  return (
    <Routes>
      {/* PUBLIC: must NOT be wrapped to allow recovery session attach */}
      <Route path="/update-password" element={<UpdatePassword />} />

      {/* Public landing & auth pages */}
      <Route path="/" element={!session ? <Index /> : <Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" replace />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><SalesRoute /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><AdminRoute><Inventory /></AdminRoute></ProtectedRoute>} />
      <Route path="/expense" element={<ProtectedRoute><AdminRoute><Expenses /></AdminRoute></ProtectedRoute>} />
      <Route path="/AdvancedAnalytics" element={<ProtectedRoute><AdminRoute><Dashboard1 /></AdminRoute></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AdminRoute><Reports /></AdminRoute></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const AppContent = () => {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  return <AppRoutes />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* BrowserRouter should wrap content that uses routing */}
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;