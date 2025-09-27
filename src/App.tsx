import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<div className="p-6">환자 관리 페이지 (개발 예정)</div>} />
            <Route path="/patients/new" element={<div className="p-6">신규 환자 등록 (개발 예정)</div>} />
            <Route path="/records" element={<div className="p-6">진료 기록 (개발 예정)</div>} />
            <Route path="/treatment" element={<div className="p-6">치료 현황 (개발 예정)</div>} />
            <Route path="/schedule" element={<div className="p-6">일정 관리 (개발 예정)</div>} />
            <Route path="/payments" element={<div className="p-6">결제 관리 (개발 예정)</div>} />
            <Route path="/health-status" element={<div className="p-6">건강 상태 (개발 예정)</div>} />
            <Route path="/reports" element={<div className="p-6">보고서 (개발 예정)</div>} />
            <Route path="/settings" element={<div className="p-6">설정 (개발 예정)</div>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
