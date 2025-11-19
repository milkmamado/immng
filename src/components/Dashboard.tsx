import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { calculateDaysSinceLastCheck, shouldAutoUpdateStatus } from "@/utils/patientStatusUtils";

interface DashboardStats {
  totalPatients: number;
  monthlyRevenue: number;
  totalRevenue: number;
  riskPatients: Array<{
    id: string;
    name: string;
    customer_number?: string;
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
  const { user, currentBranch } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    riskPatients: []
  });
  const [managerStats, setManagerStats] = useState<ManagerStat[]>([]);
  const [isMasterOrAdmin, setIsMasterOrAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && currentBranch) {
      // 데이터 초기화 (지점 변경 시 이전 데이터 제거)
      setStats({
        totalPatients: 0,
        monthlyRevenue: 0,
        totalRevenue: 0,
        riskPatients: []
      });
      setManagerStats([]);
      setLoading(true);
      
      checkUserRole();
      fetchDashboardData();
    }
  }, [user, currentBranch]);

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
        .select('id, name, customer_number, assigned_manager, manager_name, last_visit_date, inflow_date, management_status, payment_amount, created_at')
        .eq('inflow_status', '유입');

      // 지점 필터 추가
      if (currentBranch) {
        patientsQuery = patientsQuery.eq('branch', currentBranch);
      }

      if (!isAdmin) {
        patientsQuery = patientsQuery.eq('assigned_manager', user.id);
      }

      const { data: patients, error: patientsError } = await patientsQuery;

      if (patientsError) throw patientsError;

      // 당월 매출 계산 (입원/외래 매출만, 예치금 제외)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // 환자 ID 목록 (유입 환자 기준)
      const patientIds = patients?.map(p => p.id) || [];

      // 당월 거래 데이터 가져오기 (입원/외래만)
      let monthlyTransactionsQuery = supabase
        .from('package_transactions')
        .select('amount, transaction_type')
        .in('transaction_type', ['inpatient_revenue', 'outpatient_revenue'])
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      // 지점 필터 추가
      if (currentBranch) {
        monthlyTransactionsQuery = monthlyTransactionsQuery.eq('branch', currentBranch);
      }

      if (patientIds.length > 0) {
        monthlyTransactionsQuery = monthlyTransactionsQuery.in('patient_id', patientIds);
      }

      const { data: monthlyTransactions } = await monthlyTransactionsQuery;

      const monthlyRevenue = monthlyTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // 누적 매출 계산 (전체 기간, 입원/외래만)
      let totalTransactionsQuery = supabase
        .from('package_transactions')
        .select('amount, transaction_type')
        .in('transaction_type', ['inpatient_revenue', 'outpatient_revenue']);

      // 지점 필터 추가
      if (currentBranch) {
        totalTransactionsQuery = totalTransactionsQuery.eq('branch', currentBranch);
      }

      if (patientIds.length > 0) {
        totalTransactionsQuery = totalTransactionsQuery.in('patient_id', patientIds);
      }

      const { data: totalTransactions } = await totalTransactionsQuery;

      const totalRevenue = totalTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // 이탈 리스크 환자 계산 (patientStatusUtils.ts와 동일한 로직 사용)
      const riskPatients = patients?.filter(patient => {
        // 최종 상태 환자는 제외
        if (!shouldAutoUpdateStatus(patient.management_status, false)) {
          return false;
        }

        // 경과 일수 계산 (우선순위: last_visit_date > inflow_date > created_at)
        const daysSinceCheck = calculateDaysSinceLastCheck(
          patient.last_visit_date,
          patient.created_at,
          patient.inflow_date
        );

        // 21일 이상인 환자만 리스크 환자로 판단 (아웃위기 + 아웃)
        return daysSinceCheck >= 21;
      }).slice(0, 10) || [];

      setStats({
        totalPatients: patients?.length || 0,
        monthlyRevenue,
        totalRevenue,
        riskPatients
      });

      // 마스터/관리자인 경우 매니저별 통계
      if (isAdmin) {
        let userRolesQuery = supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'manager')
          .eq('approval_status', 'approved');

        // 지점 필터 추가
        if (currentBranch) {
          userRolesQuery = userRolesQuery.eq('branch', currentBranch);
        }

        const { data: userRoles } = await userRolesQuery;

        if (userRoles && userRoles.length > 0) {
          const managerIds = userRoles.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', managerIds);

          const managerStatsData = await Promise.all(
            (profiles || []).map(async (profile) => {
              // 해당 매니저의 유입 환자 조회
              let managerPatientsQuery = supabase
                .from('patients')
                .select('id')
                .eq('assigned_manager', profile.id)
                .eq('inflow_status', '유입');
              
              // 지점 필터 추가
              if (currentBranch) {
                managerPatientsQuery = managerPatientsQuery.eq('branch', currentBranch);
              }
              
              const { data: managerPatients } = await managerPatientsQuery;
              const managerPatientIds = managerPatients?.map(p => p.id) || [];

              // 해당 매니저 환자들의 당월 입원/외래 매출 집계
              let managerRevenueQuery = supabase
                .from('package_transactions')
                .select('amount')
                .in('transaction_type', ['inpatient_revenue', 'outpatient_revenue'])
                .gte('transaction_date', startDate)
                .lte('transaction_date', endDate);

              if (currentBranch) {
                managerRevenueQuery = managerRevenueQuery.eq('branch', currentBranch);
              }

              if (managerPatientIds.length > 0) {
                managerRevenueQuery = managerRevenueQuery.in('patient_id', managerPatientIds);
              }

              const { data: managerRevenue } = await managerRevenueQuery;
              const revenue = managerRevenue?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

              return {
                id: profile.id,
                name: profile.name,
                patient_count: managerPatients?.length || 0,
                monthly_revenue: revenue
              };
            })
          );

          // 환자가 있는 매니저만 필터링
          setManagerStats(managerStatsData.filter(stat => stat.patient_count > 0));
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              3주 이상 체크 없음
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
              {new Date().getMonth() + 1}월 입원/외래
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">누적 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              전체 기간 입원/외래
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
                      {patient.customer_number || '-'}
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