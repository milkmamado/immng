import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, AlertTriangle, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { calculateDaysSinceLastCheck, calculateAutoManagementStatus, shouldAutoUpdateStatus } from "@/utils/patientStatusUtils";

interface DashboardStats {
  newRegistrations: number;        // 신규 등록
  inflowPatients: number;          // 유입 환자
  treatmentAgreementRate: number;  // 치료동의율
  retentionRate: number;           // 재진관리비율
  phoneConsult: number;            // 전화상담
  visitConsult: number;            // 방문상담
  failed: number;                  // 실패
  treatmentCompleted: number;      // 치료종료
  outThisMonth: number;            // 11월 아웃
  outTotal: number;                // 전체 아웃
  missingInflowDate: number;       // 유입일 미등록
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
    newRegistrations: 0,
    inflowPatients: 0,
    treatmentAgreementRate: 0,
    retentionRate: 0,
    phoneConsult: 0,
    visitConsult: 0,
    failed: 0,
    treatmentCompleted: 0,
    outThisMonth: 0,
    outTotal: 0,
    missingInflowDate: 0,
    riskPatients: []
  });
  const [managerStats, setManagerStats] = useState<ManagerStat[]>([]);
  const [isMasterOrAdmin, setIsMasterOrAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && currentBranch) {
      // 데이터 초기화 (지점 변경 시 이전 데이터 제거)
      setStats({
        newRegistrations: 0,
        inflowPatients: 0,
        treatmentAgreementRate: 0,
        retentionRate: 0,
        phoneConsult: 0,
        visitConsult: 0,
        failed: 0,
        treatmentCompleted: 0,
        outThisMonth: 0,
        outTotal: 0,
        missingInflowDate: 0,
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

      // 현재 월 계산
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const selectedMonthStart = new Date(year, month - 1, 1);
      const selectedMonthEnd = new Date(year, month, 0);
      const endDate = selectedMonthEnd;
      const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedMonthEnd.getDate()).padStart(2, '0')}`;

      // 1. 신규 등록 (inflow_date 기준)
      let newRegistrationsQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .not('inflow_date', 'is', null);

      if (currentBranch) {
        newRegistrationsQuery = newRegistrationsQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        newRegistrationsQuery = newRegistrationsQuery.eq('assigned_manager', user.id);
      }

      const { data: newRegsData } = await newRegistrationsQuery;
      const newRegistrations = newRegsData?.filter(p => {
        const inflowDate = new Date(p.inflow_date!);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 2. 유입 환자 (inflow_status='유입', management_status='관리 중', inflow_date 필수)
      let inflowQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .eq('inflow_status', '유입')
        .eq('management_status', '관리 중')
        .not('inflow_date', 'is', null);

      if (currentBranch) {
        inflowQuery = inflowQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        inflowQuery = inflowQuery.eq('assigned_manager', user.id);
      }

      const { data: inflowData } = await inflowQuery;
      const inflowPatients = inflowData?.filter(p => {
        const inflowDate = new Date(p.inflow_date!);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 3. 치료종료 (inflow_status='유입', management_status='치료종료', inflow_date 필수)
      let treatmentCompletedQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .eq('inflow_status', '유입')
        .eq('management_status', '치료종료')
        .not('inflow_date', 'is', null);

      if (currentBranch) {
        treatmentCompletedQuery = treatmentCompletedQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        treatmentCompletedQuery = treatmentCompletedQuery.eq('assigned_manager', user.id);
      }

      const { data: completedData } = await treatmentCompletedQuery;
      const treatmentCompleted = completedData?.filter(p => {
        const inflowDate = new Date(p.inflow_date!);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 4. 치료동의율 = (유입 환자 + 치료종료) / 신규 등록 × 100
      const treatmentAgreementRate = newRegistrations > 0
        ? Math.round(((inflowPatients + treatmentCompleted) / newRegistrations) * 100)
        : 0;

      // 5. 재진관리비율 - 전월 유입 중 현재 관리 중 또는 치료종료 비율
      const prevMonthStart = new Date(year, month - 2, 1);
      const prevMonthEnd = new Date(year, month - 1, 0);

      let prevMonthQuery = supabase
        .from('patients')
        .select('id, inflow_date, management_status')
        .eq('inflow_status', '유입')
        .not('inflow_date', 'is', null);

      if (currentBranch) {
        prevMonthQuery = prevMonthQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        prevMonthQuery = prevMonthQuery.eq('assigned_manager', user.id);
      }

      const { data: prevMonthData } = await prevMonthQuery;
      const prevMonthPatients = prevMonthData?.filter(p => {
        const inflowDate = new Date(p.inflow_date!);
        return inflowDate >= prevMonthStart && inflowDate <= prevMonthEnd;
      }) || [];

      const retainedPatients = prevMonthPatients.filter(p =>
        p.management_status === '관리 중' || p.management_status === '치료종료'
      ).length;

      const retentionRate = prevMonthPatients.length > 0
        ? Math.round((retainedPatients / prevMonthPatients.length) * 100)
        : 0;

      // 6. 전화상담
      let phoneConsultQuery = supabase
        .from('patients')
        .select('id, consultation_date')
        .eq('inflow_status', '전화상담')
        .not('consultation_date', 'is', null);

      if (currentBranch) {
        phoneConsultQuery = phoneConsultQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        phoneConsultQuery = phoneConsultQuery.eq('assigned_manager', user.id);
      }

      const { data: phoneConsultData } = await phoneConsultQuery;
      const phoneConsult = phoneConsultData?.filter(p => {
        const consultDate = new Date(p.consultation_date!);
        return consultDate >= selectedMonthStart && consultDate <= endDate;
      }).length || 0;

      // 7. 방문상담
      let visitConsultQuery = supabase
        .from('patients')
        .select('id, consultation_date')
        .eq('inflow_status', '방문상담')
        .not('consultation_date', 'is', null);

      if (currentBranch) {
        visitConsultQuery = visitConsultQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        visitConsultQuery = visitConsultQuery.eq('assigned_manager', user.id);
      }

      const { data: visitConsultData } = await visitConsultQuery;
      const visitConsult = visitConsultData?.filter(p => {
        const consultDate = new Date(p.consultation_date!);
        return consultDate >= selectedMonthStart && consultDate <= endDate;
      }).length || 0;

      // 8. 실패
      let failedQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .eq('inflow_status', '실패')
        .not('inflow_date', 'is', null);

      if (currentBranch) {
        failedQuery = failedQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        failedQuery = failedQuery.eq('assigned_manager', user.id);
      }

      const { data: failedData } = await failedQuery;
      const failed = failedData?.filter(p => {
        const inflowDate = new Date(p.inflow_date!);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 9. 11월 아웃 (해당월에 등록 후 아웃/아웃위기)
      let outThisMonthQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .in('management_status', ['아웃', '아웃위기'])
        .not('inflow_date', 'is', null);

      if (currentBranch) {
        outThisMonthQuery = outThisMonthQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        outThisMonthQuery = outThisMonthQuery.eq('assigned_manager', user.id);
      }

      const { data: outThisMonthData } = await outThisMonthQuery;
      const outThisMonth = outThisMonthData?.filter(p => {
        const inflowDate = new Date(p.inflow_date!);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 10. 전체 아웃
      let outTotalQuery = supabase
        .from('patients')
        .select('id')
        .in('management_status', ['아웃', '아웃위기']);

      if (currentBranch) {
        outTotalQuery = outTotalQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        outTotalQuery = outTotalQuery.eq('assigned_manager', user.id);
      }

      const { data: outTotalData } = await outTotalQuery;
      const outTotal = outTotalData?.length || 0;

      // 11. 유입일 미등록
      let missingInflowQuery = supabase
        .from('patients')
        .select('id')
        .eq('inflow_status', '유입')
        .is('inflow_date', null);

      if (currentBranch) {
        missingInflowQuery = missingInflowQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        missingInflowQuery = missingInflowQuery.eq('assigned_manager', user.id);
      }

      const { data: missingInflowData } = await missingInflowQuery;
      const missingInflowDate = missingInflowData?.length || 0;

      // 12. 이탈 리스크 환자 (기존 로직 유지)
      let patientsQuery = supabase
        .from('patients')
        .select('id, name, customer_number, assigned_manager, manager_name, last_visit_date, inflow_date, management_status, payment_amount, created_at')
        .eq('inflow_status', '유입');

      if (currentBranch) {
        patientsQuery = patientsQuery.eq('branch', currentBranch);
      }
      if (!isAdmin) {
        patientsQuery = patientsQuery.eq('assigned_manager', user.id);
      }

      const { data: patients } = await patientsQuery;
      const patientIds = patients?.map(p => p.id) || [];

      let statusQuery = supabase
        .from("daily_patient_status")
        .select("patient_id, status_date")
        .order("status_date", { ascending: false });

      if (currentBranch) {
        statusQuery = statusQuery.eq('branch', currentBranch);
      }
      if (patientIds.length > 0) {
        statusQuery = statusQuery.in('patient_id', patientIds);
      }

      const { data: statusData } = await statusQuery;
      const lastCheckMap = new Map<string, string>();
      statusData?.forEach(status => {
        if (!lastCheckMap.has(status.patient_id)) {
          lastCheckMap.set(status.patient_id, status.status_date);
        }
      });

      const riskPatients = patients?.filter(patient => {
        const lastCheckDate = lastCheckMap.get(patient.id);
        const daysSinceCheck = calculateDaysSinceLastCheck(lastCheckDate, patient.created_at, patient.inflow_date);
        const autoUpdateAllowed = shouldAutoUpdateStatus(patient.management_status, true);
        let newManagementStatus = patient.management_status || "관리 중";
        if (autoUpdateAllowed) {
          newManagementStatus = calculateAutoManagementStatus(daysSinceCheck);
        }
        return newManagementStatus === "아웃" || newManagementStatus === "아웃위기";
      }).slice(0, 10) || [];

      setStats({
        newRegistrations,
        inflowPatients,
        treatmentAgreementRate,
        retentionRate,
        phoneConsult,
        visitConsult,
        failed,
        treatmentCompleted,
        outThisMonth,
        outTotal,
        missingInflowDate,
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
                .gte('transaction_date', startDateStr)
                .lte('transaction_date', endDateStr);

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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{new Date().getMonth() + 1}월 신규 등록</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newRegistrations}명</div>
            <p className="text-xs text-muted-foreground">
              해당 월에 초진관리에 등록된 전체 환자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{new Date().getMonth() + 1}월 유입 환자</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inflowPatients}명</div>
            <p className="text-xs text-muted-foreground">
              치료동의, 결제완료
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{new Date().getMonth() + 1}월 치료동의율</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.treatmentAgreementRate}%</div>
            <p className="text-xs text-muted-foreground">
              (유입 환자 + 치료종료) ÷ 신규 등록 × 100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{new Date().getMonth() + 1}월 재진관리비율</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.retentionRate}%</div>
            <p className="text-xs text-muted-foreground">
              전월 유입 중 (관리 중+치료종료) ÷ 전월 유입 × 100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{new Date().getMonth() + 1}월 전화상담</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.phoneConsult}명</div>
            <p className="text-xs text-muted-foreground">
              유입상태='전화상담' 환자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{new Date().getMonth() + 1}월 방문상담</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visitConsult}명</div>
            <p className="text-xs text-muted-foreground">
              유입상태='방문상담' 환자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{new Date().getMonth() + 1}월 실패</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}명</div>
            <p className="text-xs text-muted-foreground">
              유입상태='실패' 환자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{new Date().getMonth() + 1}월 치료종료</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.treatmentCompleted}명</div>
            <p className="text-xs text-muted-foreground">
              유입상태='유입', 관리상태='치료종료', 유입일 기준
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{new Date().getMonth() + 1}월 아웃</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.outThisMonth}명</div>
            <p className="text-xs text-muted-foreground">
              {new Date().getMonth() + 1}월 등록 후 아웃/아웃위기
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 아웃</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.outTotal}명</div>
            <p className="text-xs text-muted-foreground">
              전체 기간 아웃/아웃위기 환자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">유입일 미등록</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.missingInflowDate}</div>
            <p className="text-xs text-muted-foreground">
              유입상태='유입' / 유입일 없음
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