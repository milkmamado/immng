import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Layout from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import BranchSelection from "./pages/BranchSelection";
import BranchAuth from "./pages/BranchAuth";
import AccountManagement from "./pages/AccountManagement";
import FirstVisitManagement from "./pages/FirstVisitManagement";
import PatientListManagement from "./pages/PatientListManagement";
import DailyStatusTracking from "./pages/DailyStatusTracking";
import ChurnedPatientSchedule from "./pages/ChurnedPatientSchedule";
import RiskManagement from "./pages/RiskManagement";
import StatisticsManagement from "./pages/StatisticsManagement";
import MarketingStatistics from "./pages/MarketingStatistics";
import UserManual from "./pages/UserManual";
import CRMBookmarklet from "./pages/CRMBookmarklet";
import PackageIntegration from "./pages/PackageIntegration";
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
        <Route path="/" element={<BranchSelection />} />
        <Route path="/:branch/auth" element={<BranchAuth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* 지점별 라우팅 */}
      <Route path="/:branch" element={<Layout><Outlet /></Layout>}>
        {/* auth 경로 리다이렉트 (로그인 후 잠깐 보이는 404 방지) */}
        <Route path="auth" element={<Navigate to=".." replace />} />
        
        <Route 
          index 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="first-visit" 
          element={
            <ProtectedRoute>
              <FirstVisitManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="patient-list" 
          element={
            <ProtectedRoute>
              <PatientListManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="daily-tracking" 
          element={
            <ProtectedRoute>
              <DailyStatusTracking />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="churned-schedule" 
          element={
            <ProtectedRoute>
              <ChurnedPatientSchedule />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="risk-management" 
          element={
            <ProtectedRoute>
              <RiskManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="statistics" 
          element={
            <ProtectedRoute>
              <StatisticsManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="user-manual" 
          element={
            <ProtectedRoute>
              <UserManual />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="crm-bookmarklet" 
          element={
            <ProtectedRoute>
              <CRMBookmarklet />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="package-integration" 
          element={
            <ProtectedRoute>
              <PackageIntegration />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="marketing-statistics"
          element={
            <ProtectedRoute requiredRole="master">
              <MarketingStatistics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="account-management"
          element={
            <ProtectedRoute requiredRole="master">
              <AccountManagement />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* 루트 경로 처리 */}
      <Route path="/" element={<Navigate to="/광명" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
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