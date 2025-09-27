import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'master' | 'manager' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 승인되지 않은 사용자 차단
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-destructive">승인 대기 중</h1>
          <p className="text-muted-foreground mb-4">
            계정이 아직 승인되지 않았습니다. 관리자의 승인을 기다려주세요.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            승인이 완료되면 로그인할 수 있습니다.
          </p>
          <button 
            onClick={() => window.location.href = "/auth"}
            className="text-primary hover:underline"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-destructive">접근 권한 없음</h1>
          <p className="text-muted-foreground mb-4">
            이 페이지에 접근할 권한이 없습니다.
            {requiredRole === 'master' && ' 마스터 권한이 필요합니다.'}
            {requiredRole === 'admin' && ' 관리자 권한이 필요합니다.'}
          </p>
          <p className="text-sm text-muted-foreground">
            현재 권한: {userRole === 'master' ? '마스터' : userRole === 'admin' ? '관리자' : '매니저'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}