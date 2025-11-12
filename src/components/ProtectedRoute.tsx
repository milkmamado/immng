import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'master' | 'manager' | 'admin';
  allowedRoles?: Array<'master' | 'manager' | 'admin'>;
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
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

  // allowedRoles가 있으면 그것을 우선 체크
  if (allowedRoles && !allowedRoles.includes(userRole as 'master' | 'manager' | 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-destructive">접근 권한 없음</h1>
          <p className="text-muted-foreground mb-4">
            이 페이지에 접근할 권한이 없습니다. 관리자 권한이 필요합니다.
          </p>
          <p className="text-sm text-muted-foreground">
            현재 권한: {userRole === 'master' ? '마스터' : userRole === 'admin' ? '관리자' : '매니저'}
          </p>
        </div>
      </div>
    );
  }

  // requiredRole이 있으면 단일 권한 체크 (하위 호환성)
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