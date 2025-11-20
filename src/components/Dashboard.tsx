import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBranchFilter } from "@/hooks/useBranchFilter";

interface DashboardStats {
  monthPatients: number;           // 신규 등록
  newPatientsThisMonth: number;    // 유입 환자
  treatmentAgreementRate: number;  // 치료동의율
  retentionRate: number;           // 재진관리비율
  phoneConsultPatientsThisMonth: number; // 전화상담
  visitConsultPatientsThisMonth: number; // 방문상담
  failedPatientsThisMonth: number;       // 실패
  treatmentCompletedThisMonth: number;   // 치료종료
  outPatientsThisMonth: number;          // 현재 월 아웃
  outPatients: number;                   // 전체 아웃
  missingInflowDatePatients: number;     // 유입일 미등록
}

export function Dashboard() {
  const { user, currentBranch, userRole } = useAuth();
  const { applyBranchFilter } = useBranchFilter();

  // 관리자와 마스터는 통계관리로 리다이렉트
  if (userRole === 'admin' || userRole === 'master') {
    return <Navigate to={`/${currentBranch}/statistics`} replace />;
  }
  const [stats, setStats] = useState<DashboardStats>({
    monthPatients: 0,
    newPatientsThisMonth: 0,
    treatmentAgreementRate: 0,
    retentionRate: 0,
    phoneConsultPatientsThisMonth: 0,
    visitConsultPatientsThisMonth: 0,
    failedPatientsThisMonth: 0,
    treatmentCompletedThisMonth: 0,
    outPatientsThisMonth: 0,
    outPatients: 0,
    missingInflowDatePatients: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (user && currentBranch) {
      fetchDashboardData();
    }
  }, [user, currentBranch, selectedMonth]);

  const fetchDashboardData = async () => {
    try {
      if (!user) return;

      setLoading(true);

      // 선택한 월의 시작일과 종료일 계산
      const [year, month] = selectedMonth.split('-').map(Number);
      const selectedMonthStart = new Date(year, month - 1, 1);
      const selectedMonthEnd = new Date(year, month, 0);

      // 현재 월이면 오늘까지만, 지난 달이면 해당 월 말일까지 집계
      const now = new Date();
      const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month - 1;
      const endDate = isCurrentMonth ? now : selectedMonthEnd;

      // 1. 해당 월 신규 등록 환자: inflow_date가 선택한 월에 있는 환자
      let monthNewPatientsQuery = supabase
        .from('patients')
        .select('id, assigned_manager, manager_name, inflow_date');

      // 일반 매니저는 본인 환자만
      monthNewPatientsQuery = monthNewPatientsQuery.eq('assigned_manager', user.id);
      
      // 지점 필터 적용
      monthNewPatientsQuery = applyBranchFilter(monthNewPatientsQuery);

      const { data: allMonthPatients, error: monthPatientsError } = await monthNewPatientsQuery;

      if (monthPatientsError) throw monthPatientsError;

      // 선택한 월에 신규 등록된 환자 필터링
      const monthNewPatients = allMonthPatients?.filter(p => {
        if (!p.inflow_date) return false;
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      });

      const totalNewRegistrations = monthNewPatients?.length || 0;

      // 2. 전체 아웃 환자 수 (management_status = '아웃' 또는 '아웃위기')
      let outStatusQuery = supabase
        .from('patients')
        .select('id')
        .in('management_status', ['아웃', '아웃위기']);
      
      outStatusQuery = outStatusQuery.eq('assigned_manager', user.id);
      outStatusQuery = applyBranchFilter(outStatusQuery);
      
      const { data: outPatients } = await outStatusQuery;
      const outPatientsCount = outPatients?.length || 0;

      // 3. 현재 월 아웃 환자 - 현재 월에 신규 등록됐다가 현재 아웃/아웃위기인 환자
      let outThisMonthQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .in('management_status', ['아웃', '아웃위기']);
      
      outThisMonthQuery = outThisMonthQuery.eq('assigned_manager', user.id);
      outThisMonthQuery = applyBranchFilter(outThisMonthQuery);
      
      const { data: outThisMonthPatients } = await outThisMonthQuery;
      
      const outPatientsThisMonthCount = outThisMonthPatients?.filter(p => {
        if (!p.inflow_date) return false;
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 4. 유입 환자 (inflow_status = '유입', management_status = '관리 중', inflow_date 필수)
      let inflowQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .eq('inflow_status', '유입')
        .eq('management_status', '관리 중')
        .not('inflow_date', 'is', null);
      
      inflowQuery = inflowQuery.eq('assigned_manager', user.id);
      inflowQuery = applyBranchFilter(inflowQuery);
      
      const { data: inflowPatients } = await inflowQuery;
      
      const newPatientsCount = inflowPatients?.filter(p => {
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 5. 전화상담 환자 수 (inflow_status='전화상담' + consultation_date 필수)
      let phoneConsultQuery = supabase
        .from('patients')
        .select('id, consultation_date, assigned_manager')
        .eq('inflow_status', '전화상담')
        .not('consultation_date', 'is', null);
      
      phoneConsultQuery = phoneConsultQuery.eq('assigned_manager', user.id);
      phoneConsultQuery = applyBranchFilter(phoneConsultQuery);
      
      const { data: phoneConsultPatients } = await phoneConsultQuery;
      
      console.log('[대시보드] 전화상담 조회 결과:', {
        totalCount: phoneConsultPatients?.length,
        selectedMonthStart,
        endDate,
        selectedMonth,
        sample: phoneConsultPatients?.slice(0, 3)
      });
      
      const managerPhoneConsultMap = new Map<string, number>();
      phoneConsultPatients?.forEach(patient => {
        const managerId = patient.assigned_manager;
        const consultDate = new Date(patient.consultation_date!);
        if (consultDate >= selectedMonthStart && consultDate <= endDate) {
          const currentCount = managerPhoneConsultMap.get(managerId) || 0;
          managerPhoneConsultMap.set(managerId, currentCount + 1);
        }
      });
      
      const phoneConsultCount = managerPhoneConsultMap.get(user.id) || 0;
      console.log('[대시보드] 전화상담 최종 카운트:', phoneConsultCount);

      // 6. 방문상담 환자 수 (inflow_status='방문상담' + consultation_date 필수)
      let visitConsultQuery = supabase
        .from('patients')
        .select('id, consultation_date, assigned_manager')
        .eq('inflow_status', '방문상담')
        .not('consultation_date', 'is', null);
      
      visitConsultQuery = visitConsultQuery.eq('assigned_manager', user.id);
      visitConsultQuery = applyBranchFilter(visitConsultQuery);
      
      const { data: visitConsultPatients } = await visitConsultQuery;
      
      console.log('[대시보드] 방문상담 조회 결과:', {
        totalCount: visitConsultPatients?.length,
        selectedMonthStart,
        endDate,
        selectedMonth,
        sample: visitConsultPatients?.slice(0, 3)
      });
      
      const managerVisitConsultMap = new Map<string, number>();
      visitConsultPatients?.forEach(patient => {
        const managerId = patient.assigned_manager;
        const consultDate = new Date(patient.consultation_date!);
        if (consultDate >= selectedMonthStart && consultDate <= endDate) {
          const currentCount = managerVisitConsultMap.get(managerId) || 0;
          managerVisitConsultMap.set(managerId, currentCount + 1);
        }
      });
      
      const visitConsultCount = managerVisitConsultMap.get(user.id) || 0;
      console.log('[대시보드] 방문상담 최종 카운트:', visitConsultCount);

      // 7. 실패 환자 수 (inflow_status='실패' + inflow_date 필수)
      let failedQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .eq('inflow_status', '실패')
        .not('inflow_date', 'is', null);
      
      failedQuery = failedQuery.eq('assigned_manager', user.id);
      failedQuery = applyBranchFilter(failedQuery);
      
      const { data: failedPatients } = await failedQuery;
      const failedCount = failedPatients?.filter(p => {
        const inflowDate = new Date(p.inflow_date!);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 8. 치료종료 환자 수 (inflow_status='유입' + management_status='치료종료' + inflow_date 필수)
      let treatmentCompletedQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .eq('inflow_status', '유입')
        .eq('management_status', '치료종료')
        .not('inflow_date', 'is', null);
      
      treatmentCompletedQuery = treatmentCompletedQuery.eq('assigned_manager', user.id);
      treatmentCompletedQuery = applyBranchFilter(treatmentCompletedQuery);
      
      const { data: treatmentCompletedPatients } = await treatmentCompletedQuery;
      const treatmentCompletedCount = treatmentCompletedPatients?.filter(p => {
        const inflowDate = new Date(p.inflow_date!);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 9. 재진관리비율 계산
      const [prevYear, prevMonth] = selectedMonth.split('-').map(Number);
      const prevMonthStart = new Date(prevYear, prevMonth - 2, 1);
      const prevMonthEnd = new Date(prevYear, prevMonth - 1, 0);
      
      let prevMonthQuery = supabase
        .from('patients')
        .select('id, inflow_date, management_status')
        .eq('inflow_status', '유입')
        .not('inflow_date', 'is', null);
      
      prevMonthQuery = prevMonthQuery.eq('assigned_manager', user.id);
      prevMonthQuery = applyBranchFilter(prevMonthQuery);
      
      const { data: prevMonthPatientsData } = await prevMonthQuery;
      
      const prevMonthPatients = prevMonthPatientsData?.filter(p => {
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= prevMonthStart && inflowDate <= prevMonthEnd;
      }) || [];

      const retainedPatients = prevMonthPatients.filter(p => 
        p.management_status === '관리 중' || p.management_status === '치료종료'
      ).length;
      const retentionRate = prevMonthPatients.length > 0 
        ? Math.round((retainedPatients / prevMonthPatients.length) * 100) 
        : 0;

      // 10. 치료동의율 계산
      const treatmentAgreementRate = totalNewRegistrations > 0 
        ? Math.round(((newPatientsCount + treatmentCompletedCount) / totalNewRegistrations) * 100) 
        : 0;

      // 11. 유입일 미등록 환자
      let missingInflowQuery = supabase
        .from('patients')
        .select('id')
        .eq('inflow_status', '유입')
        .is('inflow_date', null);
      
      missingInflowQuery = missingInflowQuery.eq('assigned_manager', user.id);
      missingInflowQuery = applyBranchFilter(missingInflowQuery);
      
      const { data: missingInflowPatients } = await missingInflowQuery;
      const missingInflowDatePatients = missingInflowPatients?.length || 0;

      setStats({
        monthPatients: totalNewRegistrations,
        newPatientsThisMonth: newPatientsCount,
        treatmentAgreementRate,
        retentionRate,
        phoneConsultPatientsThisMonth: phoneConsultCount,
        visitConsultPatientsThisMonth: visitConsultCount,
        failedPatientsThisMonth: failedCount,
        treatmentCompletedThisMonth: treatmentCompletedCount,
        outPatientsThisMonth: outPatientsThisMonthCount,
        outPatients: outPatientsCount,
        missingInflowDatePatients
      });

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">데이터를 불러오는 중...</div>;
  }

  const monthDisplay = selectedMonth.split('-')[1];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">내 대시보드</h1>

      {/* 첫 번째 줄: 신규 등록 / 유입 환자 / 치료동의율 / 재진관리비율 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{monthDisplay}월 신규 등록</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.monthPatients}명</div>
            <CardDescription className="text-xs mt-1">
              해당 월에 초진관리에 등록된 전체 환자
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{monthDisplay}월 유입 환자</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.newPatientsThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              치료동의, 결제완료
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{monthDisplay}월 치료동의율</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.treatmentAgreementRate}%</div>
            <CardDescription className="text-xs mt-1">
              <div className="font-semibold text-foreground/80">(유입 환자 + 치료종료) ÷ 신규 등록 × 100</div>
              <div className="text-muted-foreground mt-0.5">
                ({stats.newPatientsThisMonth}명 + {stats.treatmentCompletedThisMonth}명 ÷ {stats.monthPatients}명)
              </div>
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{monthDisplay}월 재진관리비율</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.retentionRate}%</div>
            <CardDescription className="text-xs mt-1">
              전월 유입 중 (관리 중+치료종료) ÷ 전월 유입 × 100
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* 두 번째 줄: 전화상담 / 방문상담 / 실패 / 치료종료 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{monthDisplay}월 전화상담</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.phoneConsultPatientsThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              유입상태='전화상담' 환자
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{monthDisplay}월 방문상담</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.visitConsultPatientsThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              유입상태='방문상담' 환자
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{monthDisplay}월 실패</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.failedPatientsThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              유입상태='실패' 환자
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{monthDisplay}월 치료종료</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{stats.treatmentCompletedThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              유입상태='유입', 관리상태='치료종료', 유입일 기준
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* 세 번째 줄: 아웃 / 전체 아웃 / 유입일 미등록 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{monthDisplay}월 아웃</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outPatientsThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              {monthDisplay}월 등록 후 아웃/아웃위기
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 아웃</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outPatients}명</div>
            <CardDescription className="text-xs mt-1">
              전체 기간 아웃/아웃위기 환자
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">유입일 미등록</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.missingInflowDatePatients}명</div>
            <CardDescription className="text-xs mt-1">
              유입상태='유입' / 유입일 미등록
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
