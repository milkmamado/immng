import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Trash2, Crown, Shield, User } from 'lucide-react';
import { format } from 'date-fns';

interface UserData {
  id?: string;
  role_id?: string;
  user_id: string;
  role: 'master' | 'admin' | 'manager';
  approval_status: 'pending' | 'approved' | 'rejected';
  requested_at?: string;
  approved_at?: string;
  name: string;
  email: string;
  phone?: string;
  joined_at?: string;
  approved_by_name?: string;
}

interface ManageUsersProps {
  type: 'pending' | 'approved';
}

export function ManageUsers({ type }: ManageUsersProps) {
  const { user } = useAuth();
  const { currentBranch } = useBranchFilter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const tableName = type === 'pending' ? 'pending_approvals' : 'approved_users';
      const orderColumn = type === 'pending' ? 'requested_at' : 'approved_at';
      
      let query = supabase
        .from(tableName)
        .select('*');
      
      // 현재 지점 필터 적용
      if (currentBranch) {
        query = query.eq('branch', currentBranch);
      }
      
      const { data, error } = await query
        .order(orderColumn, { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('사용자 조회 실패:', error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "사용자 정보를 불러오는데 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [type, currentBranch]); // currentBranch 의존성 추가

  const handleApprove = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "승인 완료",
        description: "사용자가 성공적으로 승인되었습니다.",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('승인 실패:', error);
      toast({
        variant: "destructive",
        title: "승인 실패",
        description: "승인 처리 중 오류가 발생했습니다.",
      });
    }
  };

  const handleReject = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          approval_status: 'rejected'
        })
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "거부 완료",
        description: "가입 신청이 거부되었습니다.",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('거부 실패:', error);
      toast({
        variant: "destructive",
        title: "거부 실패",
        description: "거부 처리 중 오류가 발생했습니다.",
      });
    }
  };

  const handleRoleChange = async (roleId: string, newRole: 'master' | 'admin' | 'manager') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "권한 변경 완료",
        description: "사용자 권한이 성공적으로 변경되었습니다.",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('권한 변경 실패:', error);
      toast({
        variant: "destructive",
        title: "권한 변경 실패",
        description: "권한 변경 중 오류가 발생했습니다.",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('정말로 이 사용자를 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다.');
      }

      const response = await fetch(
        `https://fxqcvxlnfbqqxxjlnebh.supabase.co/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '사용자 삭제에 실패했습니다.');
      }

      toast({
        title: "사용자 삭제 완료",
        description: "사용자가 완전히 삭제되었습니다.",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('사용자 삭제 실패:', error);
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: error.message || "사용자 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'manager': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      master: 'destructive',
      admin: 'secondary',
      manager: 'default'
    } as const;

    const labels = {
      master: '마스터',
      admin: '관리자',
      manager: '매니저'
    };

    return (
      <Badge variant={variants[role as keyof typeof variants]}>
        {getRoleIcon(role)}
        <span className="ml-1">{labels[role as keyof typeof labels]}</span>
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {type === 'pending' ? '승인 대기 중인 사용자가 없습니다.' : '승인된 사용자가 없습니다.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((userData) => (
        <Card key={userData.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{userData.name}</h3>
                {getRoleBadge(userData.role)}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>이메일: {userData.email}</p>
                {userData.phone && <p>전화번호: {userData.phone}</p>}
                {type === 'pending' && userData.requested_at && (
                  <p>신청일: {format(new Date(userData.requested_at), 'yyyy-MM-dd HH:mm')}</p>
                )}
                {type === 'approved' && userData.approved_at && (
                  <p>승인일: {format(new Date(userData.approved_at), 'yyyy-MM-dd HH:mm')}</p>
                )}
                {userData.approved_by_name && (
                  <p>승인자: {userData.approved_by_name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {type === 'pending' ? (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(userData.user_id, userData.id || userData.role_id || '')}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    승인
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(userData.id || userData.role_id || '')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    거부
                  </Button>
                </>
              ) : (
                <>
                  <Select
                    value={userData.role}
                    onValueChange={(value) => handleRoleChange(userData.id || userData.role_id || '', value as 'master' | 'admin' | 'manager')}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">매니저</SelectItem>
                      <SelectItem value="admin">관리자</SelectItem>
                      <SelectItem value="master">마스터</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteUser(userData.user_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}