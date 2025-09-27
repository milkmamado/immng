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
          path="/patients" 
          element={
            <ProtectedRoute>
              <div className="p-6">환자 관리 페이지 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patients/new" 
          element={
            <ProtectedRoute>
              <div className="p-6">신규 환자 등록 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/records" 
          element={
            <ProtectedRoute>
              <div className="p-6">진료 기록 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/treatment" 
          element={
            <ProtectedRoute>
              <div className="p-6">치료 현황 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/schedule" 
          element={
            <ProtectedRoute>
              <div className="p-6">일정 관리 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payments" 
          element={
            <ProtectedRoute>
              <div className="p-6">결제 관리 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/health-status" 
          element={
            <ProtectedRoute>
              <div className="p-6">건강 상태 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <div className="p-6">보고서 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <div className="p-6">설정 (개발 예정)</div>
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
