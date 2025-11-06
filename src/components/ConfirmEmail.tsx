import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

export function ConfirmEmail() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmEmail = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "이메일을 입력해주세요.",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('confirm-email', {
        body: { email }
      });

      if (error) {
        throw new Error(error.message || '이메일 확인 처리에 실패했습니다.');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "이메일 확인 완료",
        description: "해당 사용자의 이메일이 확인 상태로 변경되었습니다.",
      });

      setEmail('');
    } catch (error: any) {
      console.error('이메일 확인 실패:', error);
      toast({
        variant: "destructive",
        title: "확인 실패",
        description: error.message || "이메일 확인 처리 중 오류가 발생했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          이메일 확인 처리
        </CardTitle>
        <CardDescription>
          이메일 미확인 상태의 사용자를 확인 상태로 변경합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Button 
            onClick={handleConfirmEmail}
            disabled={loading}
          >
            {loading ? '처리 중...' : '확인 처리'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}