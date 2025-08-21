import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import StrictAdminRoute from './pages/StrictAdminRoute'; // <-- Keep this new import
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard'; // <-- Your original Dashboard component
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
      {/* PUBLIC ROUTES */}
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/" element={!session ? <Index /> : <Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" replace />} />

      {/* PROTECTED ROUTES (This is the key section to keep) */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      
      {/* Accessible to Admins AND Staff */}
      <Route path="/inventory" element={<ProtectedRoute><AdminRoute><Inventory /></AdminRoute></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><SalesRoute /></ProtectedRoute>} />

      {/* Accessible ONLY to "pure" Admins */}
      <Route path="/expense" element={<ProtectedRoute><StrictAdminRoute><Expenses /></StrictAdminRoute></ProtectedRoute>} />
      <Route path="/AdvancedAnalytics" element={<ProtectedRoute><StrictAdminRoute><Dashboard1 /></StrictAdminRoute></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><StrictAdminRoute><Reports /></StrictAdminRoute></ProtectedRoute>} />

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
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;