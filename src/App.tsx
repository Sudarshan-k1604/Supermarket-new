
// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { AuthProvider } from "@/contexts/AuthContext";
// import ProtectedRoute from "@/components/ProtectedRoute";
// import Index from "./pages/Index";
// import Auth from "./pages/Auth";
// import Dashboard from "./pages/Dashboard";
// import Inventory from "./pages/Inventory";
// import Sales from "./pages/Sales";
// import Expenses from "./pages/Expenses";
// import Reports from "./pages/Reports";
// import NotFound from "./pages/NotFound";
// import AdvancedAnalytics from "./pages/AdvancedAnalytics";
// // import CustomerPOSPage from "@/pages/app/customer-pos/page";


// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <AuthProvider>
//       <TooltipProvider>
//         <Toaster />
//         <Sonner />
//         <BrowserRouter>
//           <Routes>
//             <Route path="/" element={<Index />} />
//             <Route path="/auth" element={<Auth />} />
//             <Route path="/dashboard" element={
//               <ProtectedRoute>
//                 <Dashboard />
//               </ProtectedRoute>
//             } />
//             <Route path="/inventory" element={
//               <ProtectedRoute>
//                 <Inventory />
//               </ProtectedRoute>
//             } />
//             <Route path="/sales" element={
//               <ProtectedRoute>
//                 <Sales />
//               </ProtectedRoute>
//             } />
//             {/* <Route 
//           path="/customer-pos" 
//           element={
//             <ProtectedRoute>
//               <CustomerPOSPage />
//             </ProtectedRoute>
//           } 
//         /> */}
//             <Route path="/expense" element={
//               <ProtectedRoute>
//                 <Expenses />
//               </ProtectedRoute>
//             } />
//             <Route path="/AdvancedAnalytics" element={
//               <ProtectedRoute>
//                 <AdvancedAnalytics />
//               </ProtectedRoute>
//             } />
//             <Route path="/reports" element={
//               <ProtectedRoute>
//                 <Reports />
//               </ProtectedRoute>
//             } />
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </BrowserRouter>
//       </TooltipProvider>
//     </AuthProvider>
//   </QueryClientProvider>
// );

// export default App;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext"; // <-- Import useAuth
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales"; // <-- This is the Admin page
import CustomerPOSPage from "./pages/CustomerPOSPage"; // <-- This is the Lite page
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Dashboard1 from "./pages/Dashboard1";
import CustomerDashboard from "./pages/d1";
import { ProfilePage } from './pages/ProfilePage'; 
const queryClient = new QueryClient();

// --- ADD THIS COMPONENT ---
// This component acts as a switch for the /sales route.
// It checks the user's role and renders the appropriate page.
const SalesRoute = () => {
  const { isAdmin } = useAuth();
  
  // If the user is an admin, show the full-featured Sales page.
  // Otherwise, show the simplified CustomerPOSPage.
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
            {/* <Route path="/customer-dashboard" element={
              <ProtectedRoute>
                <CustomerDashboard />
              </ProtectedRoute>
            } /> */}
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } />
            
            {/* --- UPDATE THIS ROUTE --- */}
            {/* This route is now role-aware. All users go to /sales,
                but the component rendered depends on their role. */}
            <Route path="/sales" element={
              <ProtectedRoute>
                <SalesRoute />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            <Route path="/expense" element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            } />
            <Route path="/AdvancedAnalytics" element={
              <ProtectedRoute>
                <Dashboard1 />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;