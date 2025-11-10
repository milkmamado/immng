import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Users, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface ManagerStats {
  manager_id: string;
  manager_name: string;
  total_patients: number;
  total_revenue: number;
  avg_revenue_per_patient: number;
  status_breakdown: {
    입원: number;
    외래: number;
    낮병동: number;
    전화FU: number;
  };
}

export default function StatisticsManagement() {
  const { user } = useAuth();
  const { applyBranchFilter } = useBranchFilter();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedManager, setSelectedManager] = useState<string>('all');
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [isMasterOrAdmin, setIsMasterOrAdmin] = useState(false);
  const [managerStats, setManagerStats] = useState<ManagerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalPatients: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    avgRevenuePerPatient: 0
  });
  // 새로운 통계 state 추가
  const [additionalStats, setAdditionalStats] = useState({
    outPatients: 0,
    newPatientsThisMonth: 0,
    phoneConsultPatientsThisMonth: 0,
    visitConsultPatientsThisMonth: 0,
    failedPatientsThisMonth: 0,
    retentionRate: 0,
    patients1MonthPlus: 0,
    patients3MonthPlus: 0,
    patients6MonthPlus: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (user && (isMasterOrAdmin || selectedManager !== 'all')) {
      fetchStatistics();
    }

    // Realtime 구독 설정 - 관련 테이블 변경 감지
    const channel = supabase
      .channel('statistics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients'
        },
        () => {
          if (user && (isMasterOrAdmin || selectedManager !== 'all')) {
            fetchStatistics();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_patient_status'
        },
        () => {
          if (user && (isMasterOrAdmin || selectedManager !== 'all')) {
            fetchStatistics();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'package_transactions'
        },
        () => {
          if (user && (isMasterOrAdmin || selectedManager !== 'all')) {
            fetchStatistics();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMonth, selectedManager, user, isMasterOrAdmin]);

  const checkUserRole = async () => {
    if (!user) return;

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, branch')
      .eq('user_id', user.id)
      .eq('approval_status', 'approved')
      .single();

    const isMaster = roleData?.role === 'master' || roleData?.role === 'admin';
    setIsMasterOrAdmin(isMaster);

    if (isMaster && roleData?.branch) {
      // 마스터/관리자는 현재 지점의 모든 사용자 목록 가져오기
      // 1. 해당 지점의 user_roles 가져오기
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('approval_status', 'approved')
        .eq('branch', roleData.branch);

      console.log('User roles data:', userRolesData, 'Error:', rolesError);

      if (userRolesData) {
        // 2. user_id들로 profiles 조회
        const userIds = userRolesData.map(ur => ur.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds)
          .order('name');

        console.log('Profiles data:', profilesData, 'Error:', profilesError);

        if (profilesData) {
          setManagers(profilesData.map(p => ({ id: p.id, name: p.name || '이름 없음' })));
        }
      }
    } else {
      // 일반 매니저는 본인만
      setSelectedManager(user.id);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      // 유입 환자 목록 가져오기 (역할에 따라 필터링, payment_amount 포함)
      let query = supabase
        .from('patients')
        .select('id, assigned_manager, manager_name, payment_amount')
        .eq('inflow_status', '유입');

      // 일반 매니저는 본인 환자만, 마스터/관리자가 특정 매니저 선택 시 해당 매니저만
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        query = query.eq('assigned_manager', targetManager);
      }
      
      // 지점 필터 적용
      query = applyBranchFilter(query);

      const { data: patients, error: patientsError } = await query;

      if (patientsError) throw patientsError;

      // 해당 월의 실제 결제 데이터 가져오기
      const { data: payments, error: paymentsError } = await supabase
        .from('treatment_plans')
        .select('treatment_amount, payment_date, is_paid, patient_id')
        .eq('is_paid', true)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      if (paymentsError) throw paymentsError;

      // 해당 월의 일별 상태 가져오기
      const { data: dailyStatuses, error: statusError } = await supabase
        .from('daily_patient_status')
        .select('patient_id, status_type, status_date')
        .gte('status_date', startDate)
        .lte('status_date', endDate)
        .order('status_date', { ascending: false });

      if (statusError) throw statusError;

      // 실장별로 그룹핑
      const managerMap = new Map<string, ManagerStats>();

      patients?.forEach(patient => {
        const managerId = patient.assigned_manager;
        const managerName = patient.manager_name || '미지정';

        if (!managerMap.has(managerId)) {
          managerMap.set(managerId, {
            manager_id: managerId,
            manager_name: managerName,
            total_patients: 0,
            total_revenue: 0,
            avg_revenue_per_patient: 0,
            status_breakdown: {
              입원: 0,
              외래: 0,
              낮병동: 0,
              전화FU: 0
            }
          });
        }

        const stats = managerMap.get(managerId)!;
        stats.total_patients += 1;
      });

      // 실제 결제 데이터로 매출 계산 (치료 계획)
      payments?.forEach(payment => {
        const patient = patients?.find(p => p.id === payment.patient_id);
        if (!patient) return;

        const stats = managerMap.get(patient.assigned_manager);
        if (!stats) return;

        stats.total_revenue += payment.treatment_amount || 0;
      });

      // 당월 거래 매출 추가 (예치금 입금 + 입원/외래 매출)
      const patientIds = patients?.map(p => p.id) || [];
      
      let monthlyTransactionsQuery = supabase
        .from('package_transactions')
        .select('amount, transaction_type, patient_id')
        .in('transaction_type', ['deposit_in', 'inpatient_revenue', 'outpatient_revenue'])
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (patientIds.length > 0) {
        monthlyTransactionsQuery = monthlyTransactionsQuery.in('patient_id', patientIds);
      }

      const { data: monthlyTransactions } = await monthlyTransactionsQuery;

      monthlyTransactions?.forEach(transaction => {
        const patient = patients?.find(p => p.id === transaction.patient_id);
        if (!patient) return;

        const stats = managerMap.get(patient.assigned_manager);
        if (!stats) return;

        stats.total_revenue += transaction.amount || 0;
      });

      // 상태별 일수 집계 (입원/재원, 외래, 낮병동, 전화F/U 각각의 총 일수)
      dailyStatuses?.forEach(status => {
        const patient = patients?.find(p => p.id === status.patient_id);
        if (!patient) return;

        const stats = managerMap.get(patient.assigned_manager);
        if (!stats) return;

        if (status.status_type === '입원' || status.status_type === '재원') {
          stats.status_breakdown.입원 += 1;
        } else if (status.status_type === '외래') {
          stats.status_breakdown.외래 += 1;
        } else if (status.status_type === '낮병동') {
          stats.status_breakdown.낮병동 += 1;
        } else if (status.status_type === '전화F/U') {
          stats.status_breakdown.전화FU += 1;
        }
      });

      // 평균 계산
      const statsArray = Array.from(managerMap.values()).map(stats => ({
        ...stats,
        avg_revenue_per_patient: stats.total_patients > 0 
          ? Math.round(stats.total_revenue / stats.total_patients) 
          : 0
      }));

      // 누적 매출 계산 (전체 기간)
      let totalTransactionsQuery = supabase
        .from('package_transactions')
        .select('amount, transaction_type, patient_id')
        .in('transaction_type', ['deposit_in', 'inpatient_revenue', 'outpatient_revenue']);

      if (patientIds.length > 0) {
        totalTransactionsQuery = totalTransactionsQuery.in('patient_id', patientIds);
      }

      const { data: totalTransactions } = await totalTransactionsQuery;

      const cumulativeRevenue = totalTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // 전체 통계 계산
      const totals = statsArray.reduce((acc, stats) => ({
        totalPatients: acc.totalPatients + stats.total_patients,
        totalRevenue: acc.totalRevenue + stats.total_revenue,
        monthlyRevenue: 0,
        avgRevenuePerPatient: 0
      }), { totalPatients: 0, totalRevenue: 0, monthlyRevenue: 0, avgRevenuePerPatient: 0 });

      totals.monthlyRevenue = totals.totalRevenue; // 당월 매출은 이미 계산됨
      totals.totalRevenue = cumulativeRevenue; // 누적 매출
      totals.avgRevenuePerPatient = totals.totalPatients > 0 
        ? Math.round(totals.monthlyRevenue / totals.totalPatients) 
        : 0;

      setManagerStats(statsArray);
      setTotalStats(totals);

      // 새로운 통계 계산 로직 추가
      // 1. 아웃 환자 수 - 담당자 필터 및 지점 필터 적용
      let statusQuery = supabase
        .from('patients')
        .select('id, management_status, created_at, first_visit_date, assigned_manager')
        .eq('inflow_status', '유입');
      
      // 담당자 필터 적용 (일반 매니저 또는 특정 매니저 선택 시)
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        statusQuery = statusQuery.eq('assigned_manager', targetManager);
      }
      
      // 지점 필터 적용
      statusQuery = applyBranchFilter(statusQuery);
      
      const { data: allPatientsWithStatus } = await statusQuery;

      const outPatientsCount = allPatientsWithStatus?.filter(
        p => p.management_status === '아웃'
      ).length || 0;

      // 2. 유입률 (해당 월 초진 환자)
      const newPatientsCount = allPatientsWithStatus?.filter(p => {
        const inflowDate = new Date(p.first_visit_date || p.created_at);
        const inflowYearMonth = `${inflowDate.getFullYear()}-${String(inflowDate.getMonth() + 1).padStart(2, '0')}`;
        return inflowYearMonth === selectedMonth;
      }).length || 0;

      // 전화상담 환자 수 (해당 월) - 지점 필터 추가
      let phoneConsultQuery = supabase
        .from('patients')
        .select('id, created_at, first_visit_date')
        .eq('inflow_status', '전화상담');
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        phoneConsultQuery = phoneConsultQuery.eq('assigned_manager', targetManager);
      }
      
      // 지점 필터 적용
      phoneConsultQuery = applyBranchFilter(phoneConsultQuery);
      
      const { data: phoneConsultPatients } = await phoneConsultQuery;
      const phoneConsultCount = phoneConsultPatients?.filter(p => {
        const inflowDate = new Date(p.first_visit_date || p.created_at);
        const inflowYearMonth = `${inflowDate.getFullYear()}-${String(inflowDate.getMonth() + 1).padStart(2, '0')}`;
        return inflowYearMonth === selectedMonth;
      }).length || 0;

      // 방문상담 환자 수 (해당 월) - 지점 필터 추가
      let visitConsultQuery = supabase
        .from('patients')
        .select('id, created_at, first_visit_date')
        .eq('inflow_status', '방문상담');
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        visitConsultQuery = visitConsultQuery.eq('assigned_manager', targetManager);
      }
      
      // 지점 필터 적용
      visitConsultQuery = applyBranchFilter(visitConsultQuery);
      
      const { data: visitConsultPatients } = await visitConsultQuery;
      const visitConsultCount = visitConsultPatients?.filter(p => {
        const inflowDate = new Date(p.first_visit_date || p.created_at);
        const inflowYearMonth = `${inflowDate.getFullYear()}-${String(inflowDate.getMonth() + 1).padStart(2, '0')}`;
        return inflowYearMonth === selectedMonth;
      }).length || 0;

      // 실패 환자 수 (해당 월) - 지점 필터 추가
      let failedQuery = supabase
        .from('patients')
        .select('id, created_at, first_visit_date')
        .eq('inflow_status', '실패');
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        failedQuery = failedQuery.eq('assigned_manager', targetManager);
      }
      
      // 지점 필터 적용
      failedQuery = applyBranchFilter(failedQuery);
      
      const { data: failedPatients } = await failedQuery;
      const failedCount = failedPatients?.filter(p => {
        const inflowDate = new Date(p.first_visit_date || p.created_at);
        const inflowYearMonth = `${inflowDate.getFullYear()}-${String(inflowDate.getMonth() + 1).padStart(2, '0')}`;
        return inflowYearMonth === selectedMonth;
      }).length || 0;

      // 3. 재진관리비율 계산
      const [prevYear, prevMonth] = selectedMonth.split('-').map(Number);
      const prevMonthDate = new Date(prevYear, prevMonth - 2, 1);
      const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
      
      // 이전 달 초진 환자
      const prevMonthPatients = allPatientsWithStatus?.filter(p => {
        const inflowDate = new Date(p.first_visit_date || p.created_at);
        const inflowYearMonth = `${inflowDate.getFullYear()}-${String(inflowDate.getMonth() + 1).padStart(2, '0')}`;
        return inflowYearMonth === prevMonthStr;
      }) || [];

      // 현재 달에 활동한 환자 ID 목록
      const activePatientIds = new Set(dailyStatuses?.map(s => s.patient_id) || []);
      
      // 이전 달 초진 중 현재 달에 활동한 환자
      const retainedPatients = prevMonthPatients.filter(p => activePatientIds.has(p.id)).length;
      const retentionRate = prevMonthPatients.length > 0 
        ? Math.round((retainedPatients / prevMonthPatients.length) * 100) 
        : 0;

      // 4. 관리 기간별 환자 수
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

      const activePatients = allPatientsWithStatus?.filter(
        p => p.management_status !== '아웃' && p.management_status !== '사망' && p.management_status !== '치료종료'
      ) || [];

      const patients1MonthPlus = activePatients.filter(p => {
        const inflowDate = new Date(p.first_visit_date || p.created_at);
        return inflowDate <= oneMonthAgo;
      }).length;

      const patients3MonthPlus = activePatients.filter(p => {
        const inflowDate = new Date(p.first_visit_date || p.created_at);
        return inflowDate <= threeMonthsAgo;
      }).length;

      const patients6MonthPlus = activePatients.filter(p => {
        const inflowDate = new Date(p.first_visit_date || p.created_at);
        return inflowDate <= sixMonthsAgo;
      }).length;

      setAdditionalStats({
        outPatients: outPatientsCount,
        newPatientsThisMonth: newPatientsCount,
        phoneConsultPatientsThisMonth: phoneConsultCount,
        visitConsultPatientsThisMonth: visitConsultCount,
        failedPatientsThisMonth: failedCount,
        retentionRate,
        patients1MonthPlus,
        patients3MonthPlus,
        patients6MonthPlus
      });

    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: "오류",
        description: "통계 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
      options.push({ value, label });
    }
    
    return options;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">통계 관리</h1>
          <p className="text-gray-600 mt-1">
            {isMasterOrAdmin ? '매출 분석 (전체)' : '내 매출 분석'}
          </p>
        </div>
        <div className="flex gap-4">
          {isMasterOrAdmin && (
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="상담실장 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {managers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 전체 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 관리 환자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalPatients}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">누적 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">전체 기간</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">당월 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">선택한 월</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 객단가</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.avgRevenuePerPatient)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 새로운 통계 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">아웃 환자</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{additionalStats.outPatients}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">유입률 (초진상담)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{additionalStats.newPatientsThisMonth}명</div>
            <p className="text-xs text-muted-foreground mt-1">선택한 월 신규 유입</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전화상담 비율</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{additionalStats.phoneConsultPatientsThisMonth}명</div>
            <p className="text-xs text-muted-foreground mt-1">선택한 월 전화상담</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">방문상담 비율</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{additionalStats.visitConsultPatientsThisMonth}명</div>
            <p className="text-xs text-muted-foreground mt-1">선택한 월 방문상담</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">실패율</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{additionalStats.failedPatientsThisMonth}명</div>
            <p className="text-xs text-muted-foreground mt-1">선택한 월 실패</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">재진관리비율</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{additionalStats.retentionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">전월 초진 → 당월 활동</p>
          </CardContent>
        </Card>
      </div>

      {/* 관리 기간별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>관리 기간별 환자 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">1개월 이상 관리</span>
                <span className="text-2xl font-bold text-blue-600">{additionalStats.patients1MonthPlus}명</span>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">3개월 이상 관리</span>
                <span className="text-2xl font-bold text-purple-600">{additionalStats.patients3MonthPlus}명</span>
              </div>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">6개월 이상 관리</span>
                <span className="text-2xl font-bold text-pink-600">{additionalStats.patients6MonthPlus}명</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 실장별 통계 */}
      {isMasterOrAdmin && selectedManager === 'all' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {managerStats.map((stats) => (
            <Card key={stats.manager_id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary to-medical-accent text-white">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {stats.manager_name}
                </CardTitle>
                <CardDescription className="text-primary-light">
                  관리 환자 {stats.total_patients}명
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">총 매출</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(stats.total_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">평균 객단가</span>
                    <span className="text-lg font-bold text-medical-accent">
                      {formatCurrency(stats.avg_revenue_per_patient)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">상태별 분포</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm text-gray-600">입원</span>
                      <span className="text-sm font-semibold text-blue-700">
                        {stats.status_breakdown.입원}회
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-600">외래</span>
                      <span className="text-sm font-semibold text-green-700">
                        {stats.status_breakdown.외래}회
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm text-gray-600">낮병동</span>
                      <span className="text-sm font-semibold text-purple-700">
                        {stats.status_breakdown.낮병동}회
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-orange-50 rounded">
                      <span className="text-sm text-gray-600">전화F/U</span>
                      <span className="text-sm font-semibold text-orange-700">
                        {stats.status_breakdown.전화FU}회
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}