import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'master' | 'manager' | 'admin' | null;
  userBranch: '강서' | '광명' | '성동' | null;
  userBranches: Array<{ branch: '강서' | '광명' | '성동'; role: 'master' | 'manager' | 'admin' }>; // 사용자가 가진 모든 지점
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
  const [userBranches, setUserBranches] = useState<Array<{ branch: '강서' | '광명' | '성동'; role: 'master' | 'manager' | 'admin' }>>([]);
  const [currentBranch, setCurrentBranch] = useState<'강서' | '광명' | '성동' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // 사용자의 모든 지점 role 조회
          setTimeout(async () => {
            try {
              const { data: rolesData } = await supabase
                .from('user_roles')
                .select('role, branch')
                .eq('user_id', session.user.id)
                .eq('approval_status', 'approved');
              
              if (rolesData && rolesData.length > 0) {
                setUserBranches(rolesData);
                
                // 마스터 계정인지 확인
                const isMaster = rolesData.some(r => r.role === 'master');
                
                // localStorage에서 currentBranch 복원
                const savedBranch = localStorage.getItem('currentBranch') as '강서' | '광명' | '성동' | null;
                
                if (savedBranch) {
                  // 마스터는 모든 지점 접근 가능, 일반 사용자는 권한 확인
                  if (isMaster) {
                    // 마스터는 저장된 지점으로 바로 설정 (해당 지점에 role이 없어도 됨)
                    setCurrentBranch(savedBranch);
                    setUserRole('master');
                    setUserBranch(savedBranch);
                  } else {
                    // 일반 사용자는 해당 지점에 권한이 있는지 확인
                    const hasSavedBranch = rolesData.some(r => r.branch === savedBranch);
                    if (hasSavedBranch) {
                      const branchRole = rolesData.find(r => r.branch === savedBranch);
                      setCurrentBranch(savedBranch);
                      setUserRole(branchRole?.role || null);
                      setUserBranch(savedBranch);
                    } else {
                      // 권한 없으면 첫 번째 지점으로
                      setCurrentBranch(rolesData[0].branch);
                      setUserRole(rolesData[0].role);
                      setUserBranch(rolesData[0].branch);
                    }
                  }
                } else {
                  // 저장된 지점이 없으면 첫 번째 지점 사용
                  setCurrentBranch(rolesData[0].branch);
                  setUserRole(rolesData[0].role);
                  setUserBranch(rolesData[0].branch);
                }
              } else {
                setUserBranches([]);
                setUserRole(null);
                setUserBranch(null);
                setCurrentBranch(null);
              }
            } catch (error) {
              console.error('역할 조회 실패:', error);
              setUserBranches([]);
              setUserRole(null);
              setUserBranch(null);
              setCurrentBranch(null);
            }
          }, 0);
        } else {
          setUserBranches([]);
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
            const { data: rolesData } = await supabase
              .from('user_roles')
              .select('role, branch')
              .eq('user_id', session.user.id)
              .eq('approval_status', 'approved');
            
            if (rolesData && rolesData.length > 0) {
              setUserBranches(rolesData);
              
              // 마스터 계정인지 확인
              const isMaster = rolesData.some(r => r.role === 'master');
              
              const savedBranch = localStorage.getItem('currentBranch') as '강서' | '광명' | '성동' | null;
              
              if (savedBranch) {
                // 마스터는 모든 지점 접근 가능
                if (isMaster) {
                  setCurrentBranch(savedBranch);
                  setUserRole('master');
                  setUserBranch(savedBranch);
                } else {
                  const hasSavedBranch = rolesData.some(r => r.branch === savedBranch);
                  if (hasSavedBranch) {
                    const branchRole = rolesData.find(r => r.branch === savedBranch);
                    setCurrentBranch(savedBranch);
                    setUserRole(branchRole?.role || null);
                    setUserBranch(savedBranch);
                  } else {
                    setCurrentBranch(rolesData[0].branch);
                    setUserRole(rolesData[0].role);
                    setUserBranch(rolesData[0].branch);
                  }
                }
              } else {
                setCurrentBranch(rolesData[0].branch);
                setUserRole(rolesData[0].role);
                setUserBranch(rolesData[0].branch);
              }
            } else {
              setUserBranches([]);
              setUserRole(null);
              setUserBranch(null);
              setCurrentBranch(null);
            }
          } catch (error) {
            console.error('역할 조회 실패:', error);
            setUserBranches([]);
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
      setUserBranches([]);
      setCurrentBranch(null);
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const switchBranch = (branch: '강서' | '광명' | '성동') => {
    // 마스터는 모든 지점 접근 가능
    const isMaster = userBranches.some(b => b.role === 'master');
    
    if (isMaster) {
      setCurrentBranch(branch);
      setUserRole('master');
      setUserBranch(branch);
      localStorage.setItem('currentBranch', branch);
    } else {
      // 일반 사용자는 해당 지점에 대한 권한이 있는지 확인
      const branchRole = userBranches.find(b => b.branch === branch);
      if (branchRole) {
        setCurrentBranch(branch);
        setUserRole(branchRole.role);
        setUserBranch(branch);
        localStorage.setItem('currentBranch', branch);
      }
    }
  };

  const value = {
    user,
    session,
    userRole,
    userBranch,
    userBranches,
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