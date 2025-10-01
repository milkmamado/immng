import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'master' | 'manager' | 'admin' | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'master' | 'manager' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // 사용자 역할 조회
          setTimeout(async () => {
            try {
              const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .eq('approval_status', 'approved')
                .single();
              
              setUserRole(roleData?.role || null);
            } catch (error) {
              console.error('역할 조회 실패:', error);
              setUserRole(null); // 승인되지 않은 경우 null
            }
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          try {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .eq('approval_status', 'approved')
              .single();
            
            setUserRole(roleData?.role || null);
          } catch (error) {
            console.error('역할 조회 실패:', error);
            setUserRole(null);
          }
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('로그아웃 에러:', error);
    } finally {
      // 에러가 발생해도 로컬 상태 강제 정리
      setUser(null);
      setSession(null);
      setUserRole(null);
      // localStorage 강제 정리
      localStorage.clear();
      // 페이지 새로고침으로 완전히 초기화
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}