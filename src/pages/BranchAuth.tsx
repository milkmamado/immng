import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BranchAuth() {
  const { branch } = useParams<{ branch: '강서' | '광명' | '성동' }>();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // 지점 정보를 localStorage에 저장
    if (branch) {
      localStorage.setItem('selectedBranch', branch);
    }
  }, [branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // 로그인
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // 모든 승인된 role 확인 (마스터는 모든 지점 접근 가능)
          const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select('approval_status, role, branch')
            .eq('user_id', data.user.id)
            .eq('approval_status', 'approved');

          if (roleError || !userRoles || userRoles.length === 0) {
            await supabase.auth.signOut();
            toast({
              variant: "destructive",
              title: "로그인 실패",
              description: `계정이 승인되지 않았거나 승인 대기 중입니다. 관리자에게 문의하세요.`,
            });
            return;
          }

          // 마스터는 모든 지점 접근 가능, 그 외는 해당 지점 role 확인
          const isMaster = userRoles.some(r => r.role === 'master');
          const hasBranchAccess = userRoles.some(r => r.branch === branch);

          if (!isMaster && !hasBranchAccess) {
            await supabase.auth.signOut();
            toast({
              variant: "destructive",
              title: "로그인 실패",
              description: `${branch}점에 대한 접근 권한이 없습니다.`,
            });
            return;
          }

          // currentBranch 설정
          localStorage.setItem('currentBranch', branch!);

          toast({
            title: "로그인 성공",
            description: `${branch}점 환자 관리 시스템에 오신 것을 환영합니다.`,
          });
          navigate(`/${branch}`);
        }
      } else {
        // 회원가입
        const redirectUrl = `${window.location.origin}/${branch}`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: name,
              branch: branch,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: "회원가입 신청 완료",
            description: "관리자 승인 후 로그인이 가능합니다. 승인까지 시간이 걸릴 수 있습니다.",
          });
          
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error('인증 오류:', error);
      setError(error.message || '오류가 발생했습니다.');
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: error.message || '인증 처리 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-8 h-8 text-primary" />
            <CardTitle className="text-3xl">{branch}점</CardTitle>
          </div>
          <CardDescription className="text-base">
            {isLogin ? '로그인하여 환자 관리 시스템에 접속하세요' : '새 계정을 만들어주세요'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            지점 선택으로 돌아가기
          </Button>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  이름
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}