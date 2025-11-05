import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Loader2 } from 'lucide-react';

export function UpdateUserPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !newPassword) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '이메일과 새 비밀번호를 모두 입력해주세요.',
      });
      return;
    }

    setIsUpdating(true);

    try {
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: { email, newPassword }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          variant: 'destructive',
          title: '오류 발생',
          description: error.message || '비밀번호 변경 중 오류가 발생했습니다.'
        });
        return;
      }

      console.log('Password update result:', data);

      if (data.success) {
        toast({
          title: '비밀번호 변경 완료',
          description: `${email} 계정의 비밀번호가 성공적으로 변경되었습니다.`
        });
        setEmail('');
        setNewPassword('');
      }

    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: error.message || '비밀번호 변경 중 오류가 발생했습니다.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          사용자 비밀번호 변경
        </CardTitle>
        <CardDescription>
          특정 사용자의 비밀번호를 관리자 권한으로 변경합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">사용자 이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input
              id="newPassword"
              type="text"
              placeholder="새 비밀번호 입력"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isUpdating}
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={isUpdating || !email || !newPassword}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                변경 중...
              </>
            ) : (
              '비밀번호 변경'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}