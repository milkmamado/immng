import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UserAccount {
  name: string;
  email: string;
  password: string;
  role: 'master' | 'admin' | 'manager';
}

export function BatchCreateUsers() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const accounts: UserAccount[] = [
    {
      name: '손효준',
      email: 'thsgywns@naver.com',
      password: 'xhfhrudtns!@^^',
      role: 'manager'
    },
    {
      name: '강미정',
      email: 'kmj12341@naver.com',
      password: 'k1234567k!',
      role: 'manager'
    },
    {
      name: '주현정',
      email: 'wnguswjd03@gmail.com',
      password: 'j1234567j!',
      role: 'manager'
    },
    {
      name: '김세이',
      email: 'naseyiyam@gmail.com',
      password: 'k1234567k!',
      role: 'admin'
    },
    {
      name: '손주연',
      email: 'notgul8778@gmail.com',
      password: 's1234567s!',
      role: 'manager'
    },
    {
      name: '이영춘',
      email: 'rocband79@gmail.com',
      password: 'e1234567e!',
      role: 'manager'
    },
    {
      name: '관리자',
      email: 'master@naver.com',
      password: 'medi12661266',
      role: 'admin'
    },
    {
      name: '손효준',
      email: 'torogrr@kakao.com',
      password: 'xhfhrudtns!@^^',
      role: 'master'
    }
  ];

  const handleBatchCreate = async () => {
    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('batch-create-users', {
        body: { accounts }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          variant: 'destructive',
          title: '오류 발생',
          description: error.message || '계정 생성 중 오류가 발생했습니다.'
        });
        return;
      }

      console.log('Batch create result:', data);

      if (data.created > 0) {
        toast({
          title: '계정 생성 완료',
          description: `${data.created}개 계정이 생성되었습니다. ${data.failed > 0 ? `${data.failed}개 실패` : ''}`
        });
      }

      if (data.errors && data.errors.length > 0) {
        console.error('Errors:', data.errors);
        toast({
          variant: 'destructive',
          title: '일부 계정 생성 실패',
          description: `${data.failed}개 계정 생성에 실패했습니다.`
        });
      }

    } catch (error: any) {
      console.error('Batch create error:', error);
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: error.message || '계정 생성 중 오류가 발생했습니다.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          일괄 계정 생성
        </CardTitle>
        <CardDescription>
          {accounts.length}개 계정을 한번에 생성합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">생성될 계정 목록:</h4>
            <ul className="text-sm space-y-1">
              {accounts.map((acc, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{acc.name} ({acc.email})</span>
                  <span className="text-muted-foreground">
                    {acc.role === 'master' ? '최고관리자' : acc.role === 'admin' ? '관리자' : '매니저'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={handleBatchCreate}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                계정 생성 중...
              </>
            ) : (
              `${accounts.length}개 계정 생성하기`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}