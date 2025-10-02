import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalPatients: number;
  monthlyRevenue: number;
  riskPatients: Array<{
    id: string;
    name: string;
    patient_number: string;
    manager_name?: string;
    last_visit_date?: string;
  }>;
}

interface ManagerStat {
  id: string;
  name: string;
  patient_count: number;
  monthly_revenue: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    monthlyRevenue: 0,
    riskPatients: []
  });
  const [managerStats, setManagerStats] = useState<ManagerStat[]>([]);
  const [isMasterOrAdmin, setIsMasterOrAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkUserRole();
      fetchDashboardData();
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user) return;

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('approval_status', 'approved')
      .single();

    setIsMasterOrAdmin(roleData?.role === 'master' || roleData?.role === 'admin');
  };

  const fetchDashboardData = async () => {
    try {
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('approval_status', 'approved')
        .single();

      const isAdmin = roleData?.role === 'master' || roleData?.role === 'admin';

      // 환자 통계 - 역할에 따라 필터링
      let patientsQuery = supabase
        .from('patients')
        .select('id, name, patient_number, assigned_manager, manager_name, last_visit_date, payment_amount, management_status')
        .eq('inflow_status', '유입');

      if (!isAdmin) {
        patientsQuery = patientsQuery.eq('assigned_manager', user.id);
      }

      const { data: patients, error: patientsError } = await patientsQuery;

      if (patientsError) throw patientsError;

      // 당월 매출 계산
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthlyRevenue = patients?.reduce((sum, p) => sum + (p.payment_amount || 0), 0) || 0;

      // 이탈 리스크 환자 (아웃위기 또는 아웃 상태인 환자)
      const riskPatients = patients?.filter(p => {
        return p.management_status === '아웃위기' || p.management_status === '아웃';
      }).slice(0, 10) || [];

      setStats({
        totalPatients: patients?.length || 0,
        monthlyRevenue,
        riskPatients
      });

      // 마스터/관리자인 경우 매니저별 통계
      if (isAdmin) {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'manager')
          .eq('approval_status', 'approved');

        if (userRoles && userRoles.length > 0) {
          const managerIds = userRoles.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', managerIds);

          const managerStatsData = await Promise.all(
            (profiles || []).map(async (profile) => {
              const { data: managerPatients } = await supabase
                .from('patients')
                .select('payment_amount')
                .eq('assigned_manager', profile.id)
                .eq('inflow_status', '유입');

              const revenue = managerPatients?.reduce((sum, p) => sum + (p.payment_amount || 0), 0) || 0;

              return {
                id: profile.id,
                name: profile.name,
                patient_count: managerPatients?.length || 0,
                monthly_revenue: revenue
              };
            })
          );

          setManagerStats(managerStatsData);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 환자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              유입 환자 총 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이탈 리스크 환자</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.riskPatients.length}</div>
            <p className="text-xs text-muted-foreground">
              아웃위기 및 아웃 상태
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">당월 현재 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {new Date().getMonth() + 1}월 매출
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 이탈 리스크 관리가 필요한 환자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            이탈 리스크 관리가 필요한 환자
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.riskPatients.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              리스크 환자가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.riskPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {patient.patient_number}
                    </div>
                    {patient.manager_name && (
                      <div className="text-xs text-muted-foreground">
                        담당: {patient.manager_name}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      최종 방문: {patient.last_visit_date ? new Date(patient.last_visit_date).toLocaleDateString() : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 매니저별 통계 (마스터/관리자만) */}
      {isMasterOrAdmin && managerStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>매니저별 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {managerStats.map((manager) => (
                <div key={manager.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{manager.name}</div>
                    <div className="text-sm text-muted-foreground">
                      환자 수: {manager.patient_count}명
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">
                      {formatCurrency(manager.monthly_revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}