import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Layout from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import Auth from "./pages/Auth";
import AccountManagement from "./pages/AccountManagement";
import FirstVisitManagement from "./pages/FirstVisitManagement";
import PatientListManagement from "./pages/PatientListManagement";
import DailyStatusTracking from "./pages/DailyStatusTracking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/first-visit" 
          element={
            <ProtectedRoute>
              <FirstVisitManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patient-list" 
          element={
            <ProtectedRoute>
              <PatientListManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/daily-tracking" 
          element={
            <ProtectedRoute>
              <DailyStatusTracking />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/account-management" 
          element={
            <ProtectedRoute requiredRole="master">
              <AccountManagement />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
