import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
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
import { Loader2 } from "lucide-react"; // --- NEW: Import the loader icon ---
import UpdatePassword from "./pages/UpdatePassword";
const queryClient = new QueryClient();

// --- NEW: All your routing logic is moved into this component ---
// It will only be rendered AFTER the initial auth check is complete.
const AppRoutes = () => {
  const { isAdmin, session } = useAuth();

  // Your existing components for conditional routing are perfect here
  const SalesRoute = () => isAdmin ? <Sales /> : <CustomerPOSPage />;
  const DashboardRoute = () => isAdmin ? <Dashboard /> : <CustomerDashboard />;

  return (
    <BrowserRouter>
      <Routes>
        {/* --- MODIFIED: Redirect logic for logged-in vs. logged-out users --- */}
        <Route path="/" element={!session ? <Index /> : <Navigate to="/dashboard" replace />} />
        <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" replace />} />

        {/* Your protected and admin routes remain the same */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute/></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><SalesRoute /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><AdminRoute><Inventory /></AdminRoute></ProtectedRoute>} />
        <Route path="/expense" element={<ProtectedRoute><AdminRoute><Expenses /></AdminRoute></ProtectedRoute>} />
        <Route path="/AdvancedAnalytics" element={<ProtectedRoute><AdminRoute><Dashboard1 /></AdminRoute></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><AdminRoute><Reports /></AdminRoute></ProtectedRoute>} />
        <Route 
          path="/update-password" 
          element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

// --- NEW: A component to handle the loading state "gate" ---
const AppContent = () => {
  const { loading } = useAuth();

  // If the auth state is loading, show a full-screen spinner and nothing else.
  // This PAUSES the app and prevents the router from rendering prematurely.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Once loading is false, render the actual application routes.
  return <AppRoutes />;
};

// --- MODIFIED: The main App component is now cleaner ---
// It sets up all the providers and then renders AppContent, which handles the logic.
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;