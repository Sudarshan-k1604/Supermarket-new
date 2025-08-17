import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute"; // --- MODIFIED: Import the new AdminRoute ---
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import CustomerPOSPage from "./pages/CustomerPOSPage";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Dashboard1 from "./pages/Dashboard1";
import CustomerDashboard from "./pages/d1";
import { ProfilePage } from './pages/ProfilePage'; 

const queryClient = new QueryClient();

const SalesRoute = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <Sales /> : <CustomerPOSPage />;
};

const DashboardRoute = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <Dashboard /> : <CustomerDashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardRoute/>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
                <ProtectedRoute>
                    <ProfilePage />
                </ProtectedRoute>
            } />
            
            <Route path="/sales" element={
              <ProtectedRoute>
                <SalesRoute />
              </ProtectedRoute>
            } />

            {/* --- MODIFIED: The following routes are now admin-only --- */}
            
            <Route path="/inventory" element={
              <ProtectedRoute>
                <AdminRoute>
                  <Inventory />
                </AdminRoute>
              </ProtectedRoute>
            } />
            
            <Route path="/expense" element={
              <ProtectedRoute>
                <AdminRoute>
                  <Expenses />
                </AdminRoute>
              </ProtectedRoute>
            } />
            
            <Route path="/AdvancedAnalytics" element={
              <ProtectedRoute>
                <AdminRoute>
                  <Dashboard1 />
                </AdminRoute>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <AdminRoute>
                  <Reports />
                </AdminRoute>
              </ProtectedRoute>
            } />

            {/* --- MODIFIED: The catch-all route now shows the NotFound page --- */}
            <Route path="*" element= {<NotFound />}/>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;