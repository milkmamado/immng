import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'master' | 'manager' | 'admin' | null;
  userBranch: '강서' | '광명' | '성동' | null;
  currentBranch: '강서' | '광명' | '성동' | null;
  loading: boolean;
  signOut: () => Promise<void>;
  switchBranch: (branch: '강서' | '광명' | '성동') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'master' | 'manager' | 'admin' | null>(null);
  const [userBranch, setUserBranch] = useState<'강서' | '광명' | '성동' | null>(null);
  const [currentBranch, setCurrentBranch] = useState<'강서' | '광명' | '성동' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // 사용자 역할 및 지점 조회
          setTimeout(async () => {
            try {
              const { data: roleData } = await supabase
                .from('user_roles')
                .select('role, branch')
                .eq('user_id', session.user.id)
                .eq('approval_status', 'approved')
                .single();
              
              setUserRole(roleData?.role || null);
              setUserBranch(roleData?.branch || null);
              
              // localStorage에서 currentBranch 복원 (master인 경우) 또는 사용자 지점으로 설정
              const savedBranch = localStorage.getItem('currentBranch') as '강서' | '광명' | '성동' | null;
              if (roleData?.role === 'master' && savedBranch) {
                setCurrentBranch(savedBranch);
              } else {
                setCurrentBranch(roleData?.branch || null);
              }
            } catch (error) {
              console.error('역할 조회 실패:', error);
              setUserRole(null);
              setUserBranch(null);
              setCurrentBranch(null);
            }
          }, 0);
        } else {
          setUserRole(null);
          setUserBranch(null);
          setCurrentBranch(null);
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
              .select('role, branch')
              .eq('user_id', session.user.id)
              .eq('approval_status', 'approved')
              .single();
            
            setUserRole(roleData?.role || null);
            setUserBranch(roleData?.branch || null);
            
            const savedBranch = localStorage.getItem('currentBranch') as '강서' | '광명' | '성동' | null;
            if (roleData?.role === 'master' && savedBranch) {
              setCurrentBranch(savedBranch);
            } else {
              setCurrentBranch(roleData?.branch || null);
            }
          } catch (error) {
            console.error('역할 조회 실패:', error);
            setUserRole(null);
            setUserBranch(null);
            setCurrentBranch(null);
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
      setUser(null);
      setSession(null);
      setUserRole(null);
      setUserBranch(null);
      setCurrentBranch(null);
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const switchBranch = (branch: '강서' | '광명' | '성동') => {
    if (userRole === 'master') {
      setCurrentBranch(branch);
      localStorage.setItem('currentBranch', branch);
    }
  };

  const value = {
    user,
    session,
    userRole,
    userBranch,
    currentBranch,
    loading,
    signOut,
    switchBranch,
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