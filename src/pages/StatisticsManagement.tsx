import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Users, TrendingUp, DollarSign, Activity, Info } from 'lucide-react';

interface ManagerStats {
  manager_id: string;
  manager_name: string;
  total_patients: number;
  total_revenue: number;
  inpatient_revenue: number;
  outpatient_revenue: number;
  non_covered_revenue: number;
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
    monthPatients: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    monthlyNonCoveredRevenue: 0,
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
    treatmentAgreementRate: 0,
    missingInflowDatePatients: 0,
    patients1MonthPlus: 0,
    patients2MonthPlus: 0,
    patients3MonthPlus: 0,
    patients6MonthPlus: 0
  });
  const { toast } = useToast();
  
  // 관리 기간별 환자 리스트 다이얼로그 state
  const [selectedPeriodDialog, setSelectedPeriodDialog] = useState<{
    open: boolean;
    period: '1month' | '2month' | '3month' | '6month' | null;
    patients: any[];
  }>({
    open: false,
    period: null,
    patients: []
  });

  // 통계 카드 클릭 환자 리스트 다이얼로그 state
  const [statsDialog, setStatsDialog] = useState<{
    open: boolean;
    type: 'out' | 'inflow' | 'phone' | 'visit' | 'failed' | 'retention' | 'missingInflow' | null;
    title: string;
    patients: any[];
  }>({
    open: false,
    type: null,
    title: '',
    patients: []
  });


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
    if (!user) {
      console.log('[checkUserRole] No user found');
      return;
    }

    console.log('[checkUserRole] Starting with user:', user.id, user.email);

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role, branch')
      .eq('user_id', user.id)
      .eq('approval_status', 'approved')
      .single();

    console.log('[checkUserRole] Role data:', roleData, 'Error:', roleError);

    const isMaster = roleData?.role === 'master' || roleData?.role === 'admin';
    setIsMasterOrAdmin(isMaster);

    console.log('[checkUserRole] isMaster:', isMaster, 'branch:', roleData?.branch);

    if (isMaster && roleData?.branch) {
      // 마스터/관리자는 현재 지점의 매니저 목록 가져오기
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('approval_status', 'approved')
        .eq('branch', roleData.branch)
        .eq('role', 'manager');

      console.log('[checkUserRole] Manager user_roles:', userRolesData, 'Error:', rolesError);

      if (userRolesData && userRolesData.length > 0) {
        // 2. user_id들로 profiles 조회
        const userIds = userRolesData.map(ur => ur.user_id);
        
        console.log('[checkUserRole] User IDs to fetch:', userIds);

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds)
          .order('name');

        console.log('[checkUserRole] Profiles data:', profilesData, 'Error:', profilesError);

        if (profilesData) {
          const managersList = profilesData.map(p => ({ id: p.id, name: p.name || '이름 없음' }));
          console.log('[checkUserRole] Setting managers:', managersList);
          setManagers(managersList);
        }
      } else {
        console.log('[checkUserRole] No managers found');
        setManagers([]);
      }
    } else {
      // 일반 매니저는 본인만
      console.log('[checkUserRole] Regular manager, setting selectedManager to:', user.id);
      setSelectedManager(user.id);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // 선택한 월의 1일부터 오늘까지 (또는 선택한 월이 지난 달이면 그 달의 마지막 날까지)
      const [year, month] = selectedMonth.split('-').map(Number);
      const today = new Date();
      const selectedMonthStart = new Date(year, month - 1, 1);
      const selectedMonthEnd = new Date(year, month, 0); // 해당 월의 마지막 날
      
      // 오늘이 선택한 월에 속하면 오늘까지, 아니면 선택한 월의 마지막 날까지
      const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month - 1;
      const endDate = isCurrentMonth ? today : selectedMonthEnd;
      
      const queryStartDate = selectedMonthStart.toISOString().split('T')[0];
      const queryEndDate = endDate.toISOString().split('T')[0];

      // 1. 해당 월 신규 유입 환자: inflow_date가 선택한 월에 있는 환자 (관리 상태 무관)
      let monthInflowPatientsQuery = supabase
        .from('patients')
        .select('id, assigned_manager, manager_name, payment_amount, inflow_date, created_at');

      // 일반 매니저는 본인 환자만, 마스터/관리자가 특정 매니저 선택 시 해당 매니저만
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        monthInflowPatientsQuery = monthInflowPatientsQuery.eq('assigned_manager', targetManager);
      }
      
      // 지점 필터 적용
      monthInflowPatientsQuery = applyBranchFilter(monthInflowPatientsQuery);

      const { data: allMonthInflowPatients, error: monthInflowPatientsError } = await monthInflowPatientsQuery;

      if (monthInflowPatientsError) throw monthInflowPatientsError;

      // 선택한 월에 유입일이 있는 환자만 필터링 (월별 신규 유입)
      const monthNewPatients = allMonthInflowPatients?.filter(p => {
        if (!p.inflow_date) return false; // 유입일이 없으면 제외
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      });

      // 2. 총 관리 환자: 전체 기간 동안 management_status가 '관리 중'인 환자 (카드/통계용)
      let totalPatientsQuery = supabase
        .from('patients')
        .select('id, assigned_manager, manager_name')
        .eq('management_status', '관리 중');

      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        totalPatientsQuery = totalPatientsQuery.eq('assigned_manager', targetManager);
      }
      
      totalPatientsQuery = applyBranchFilter(totalPatientsQuery);
      
      const { data: totalPatientsData } = await totalPatientsQuery;
      const totalPatientsCount = totalPatientsData?.length || 0;

      // 매출 집계용: 관리 상태와 무관하게 해당 매니저의 모든 환자
      let managerAllPatientsQuery = supabase
        .from('patients')
        .select('id, assigned_manager, manager_name');

      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        managerAllPatientsQuery = managerAllPatientsQuery.eq('assigned_manager', targetManager);
      }
      managerAllPatientsQuery = applyBranchFilter(managerAllPatientsQuery);
      const { data: managerAllPatients } = await managerAllPatientsQuery;

      // 해당 기간의 실제 결제 데이터 가져오기
      const { data: payments, error: paymentsError } = await supabase
        .from('treatment_plans')
        .select('treatment_amount, payment_date, is_paid, patient_id')
        .eq('is_paid', true)
        .gte('payment_date', queryStartDate)
        .lte('payment_date', queryEndDate);

      if (paymentsError) throw paymentsError;

      // 해당 기간의 일별 상태 가져오기
      const { data: dailyStatuses, error: statusError } = await supabase
        .from('daily_patient_status')
        .select('patient_id, status_type, status_date')
        .gte('status_date', queryStartDate)
        .lte('status_date', queryEndDate)
        .order('status_date', { ascending: false });

      if (statusError) throw statusError;

      // 실장별로 그룹핑
      const managerMap = new Map<string, ManagerStats>();
      
      // 먼저 당월 신규 유입 환자 기준으로 매니저별 환자 수 집계
      monthNewPatients?.forEach(patient => {
        const managerId = patient.assigned_manager;
        const managerName = patient.manager_name || '미지정';

        if (!managerMap.has(managerId)) {
          managerMap.set(managerId, {
            manager_id: managerId,
            manager_name: managerName,
            total_patients: 0,
            total_revenue: 0,
            inpatient_revenue: 0,
            outpatient_revenue: 0,
            non_covered_revenue: 0,
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
        stats.total_patients += 1; // 당월 신규 유입 환자 수
      });

      // 실제 결제 데이터로 매출 계산 (치료 계획)
      payments?.forEach(payment => {
        const patient = totalPatientsData?.find(p => p.id === payment.patient_id);
        if (!patient) return;

        const stats = managerMap.get(patient.assigned_manager);
        if (!stats) return;

        stats.total_revenue += payment.treatment_amount || 0;
      });

      // 전체 기간의 모든 거래 가져오기 (누적 매출 계산용)
      let allTransactionsQuery = supabase
        .from('package_transactions')
        .select('amount, non_covered_amount, transaction_type, patient_id')
        .in('transaction_type', ['inpatient_revenue', 'outpatient_revenue']);

      // 지점 필터 적용
      allTransactionsQuery = applyBranchFilter(allTransactionsQuery);

      // 매니저 필터 적용
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        // 해당 매니저의 환자 ID들 가져오기
        let managerPatientsQuery = supabase
          .from('patients')
          .select('id')
          .eq('assigned_manager', targetManager);
        managerPatientsQuery = applyBranchFilter(managerPatientsQuery);
        const { data: managerPatients } = await managerPatientsQuery;
        const managerPatientIds = managerPatients?.map(p => p.id) || [];
        if (managerPatientIds.length > 0) {
          allTransactionsQuery = allTransactionsQuery.in('patient_id', managerPatientIds);
        }
      }

      const { data: allTransactions } = await allTransactionsQuery;

      // 당월 거래 가져오기
      let monthlyTransactionsQuery = supabase
        .from('package_transactions')
        .select('amount, non_covered_amount, transaction_type, patient_id')
        .in('transaction_type', ['inpatient_revenue', 'outpatient_revenue'])
        .gte('transaction_date', queryStartDate)
        .lte('transaction_date', queryEndDate);

      // 지점 필터 적용
      monthlyTransactionsQuery = applyBranchFilter(monthlyTransactionsQuery);

      // 매니저 필터 적용
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        let managerPatientsQuery = supabase
          .from('patients')
          .select('id')
          .eq('assigned_manager', targetManager);
        managerPatientsQuery = applyBranchFilter(managerPatientsQuery);
        const { data: managerPatients } = await managerPatientsQuery;
        const managerPatientIds = managerPatients?.map(p => p.id) || [];
        if (managerPatientIds.length > 0) {
          monthlyTransactionsQuery = monthlyTransactionsQuery.in('patient_id', managerPatientIds);
        } else {
          // 매니저의 환자가 없으면 빈 결과 반환
          monthlyTransactionsQuery = monthlyTransactionsQuery.in('patient_id', []);
        }
      }

      const { data: monthlyTransactions } = await monthlyTransactionsQuery;

      // 환자 ID별 매니저 정보 매핑 (매출은 관리 상태와 무관하게 전체 환자 기준)
      const patientManagerMap = new Map<string, string>();
      managerAllPatients?.forEach(p => {
        patientManagerMap.set(p.id, p.assigned_manager);
      });

      // 누적 매출 계산 (전체 기간)
      allTransactions?.forEach(transaction => {
        const managerId = patientManagerMap.get(transaction.patient_id);
        if (!managerId) return;

        let stats = managerMap.get(managerId);
        if (!stats) {
          // 매니저 정보가 없으면 새로 생성
          const patient = allMonthInflowPatients?.find(p => p.assigned_manager === managerId);
          stats = {
            manager_id: managerId,
            manager_name: patient?.manager_name || '미지정',
            total_patients: 0,
            total_revenue: 0,
            inpatient_revenue: 0,
            outpatient_revenue: 0,
            non_covered_revenue: 0,
            avg_revenue_per_patient: 0,
            status_breakdown: {
              입원: 0,
              외래: 0,
              낮병동: 0,
              전화FU: 0
            }
          };
          managerMap.set(managerId, stats);
        }

        // 누적 매출 = 전체 입원/외래 총진료비 합
        stats.total_revenue += transaction.amount || 0;
      });

      // 당월 매출 및 비급여 매출 계산
      let monthlyRevenue = 0;
      let monthlyNonCoveredRevenue = 0;
      let monthlyInpatientRevenue = 0;
      let monthlyOutpatientRevenue = 0;

      monthlyTransactions?.forEach(transaction => {
        const managerId = patientManagerMap.get(transaction.patient_id);
        if (!managerId) return;

        const stats = managerMap.get(managerId);
        if (!stats) return;

        // 당월 입원/외래 총진료비 합산
        monthlyRevenue += transaction.amount || 0;
        
        // 매출 타입별 집계
        if (transaction.transaction_type === 'inpatient_revenue') {
          stats.inpatient_revenue += transaction.amount || 0;
          monthlyInpatientRevenue += transaction.amount || 0;
        } else if (transaction.transaction_type === 'outpatient_revenue') {
          stats.outpatient_revenue += transaction.amount || 0;
          monthlyOutpatientRevenue += transaction.amount || 0;
        }
        
        // 당월 비급여 매출 = 입원/외래 비급여액 합산
        stats.non_covered_revenue += transaction.non_covered_amount || 0;
        monthlyNonCoveredRevenue += transaction.non_covered_amount || 0;
      });

      // 상태별 일수 집계 (입원/재원, 외래, 낮병동, 전화F/U 각각의 총 일수)
      dailyStatuses?.forEach(status => {
        const patient = monthNewPatients?.find(p => p.id === status.patient_id);
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

      // 매니저별 평균 객단가 계산을 위해 각 매니저의 11월 유입환자 수 계산
      const managerInflowCountMap = new Map<string, number>();
      
      for (const [managerId, stats] of managerMap.entries()) {
        // 해당 매니저의 11월 유입환자 수 계산 (inflow_status='유입', management_status='관리 중')
        let managerInflowQuery = supabase
          .from('patients')
          .select('id, inflow_date, created_at')
          .eq('inflow_status', '유입')
          .eq('management_status', '관리 중')
          .eq('assigned_manager', managerId);
        
        managerInflowQuery = applyBranchFilter(managerInflowQuery);
        
        const { data: managerInflowPatients } = await managerInflowQuery;
        
        const managerNewPatientsCount = managerInflowPatients?.filter(p => {
          const refDate = p.inflow_date ? new Date(p.inflow_date) : new Date(p.created_at);
          return refDate >= selectedMonthStart && refDate <= endDate;
        }).length || 0;
        
        managerInflowCountMap.set(managerId, managerNewPatientsCount);
      }

      // 평균 계산 - 당월 매출 / 11월 유입환자 수
      const statsArray = Array.from(managerMap.values()).map(stats => {
        const monthlyTotal = stats.inpatient_revenue + stats.outpatient_revenue;
        const inflowCount = managerInflowCountMap.get(stats.manager_id) || 0;
        
        console.log('[Statistics] Manager:', stats.manager_name, {
          inpatient_revenue: stats.inpatient_revenue,
          outpatient_revenue: stats.outpatient_revenue,
          monthlyTotal,
          inflowCount,
          avg: inflowCount > 0 ? Math.round(monthlyTotal / inflowCount) : 0
        });
        
        return {
          ...stats,
          avg_revenue_per_patient: inflowCount > 0 
            ? Math.round(monthlyTotal / inflowCount) 
            : 0
        };
      });

      // 전체 통계 계산
      const totals = statsArray.reduce((acc, stats) => ({
        totalPatients: 0, // 별도 계산됨
        monthPatients: acc.monthPatients + stats.total_patients,
        totalRevenue: acc.totalRevenue + stats.total_revenue, // 누적 매출 합계
        monthlyRevenue: 0, // 아래에서 계산
        monthlyNonCoveredRevenue: acc.monthlyNonCoveredRevenue + stats.non_covered_revenue, // 당월 비급여 합계
        avgRevenuePerPatient: 0
      }), { 
        totalPatients: 0, 
        monthPatients: 0, 
        totalRevenue: 0, 
        monthlyRevenue: 0, 
        monthlyNonCoveredRevenue: 0, 
        avgRevenuePerPatient: 0 
      });

      totals.totalPatients = totalPatientsCount; // 전체 기간 관리 중 환자
      totals.monthlyRevenue = monthlyRevenue; // 당월 매출 (입원+외래 총진료비)
      
      // 객단가 계산은 아래에서 newPatientsCount(11월 유입환자 카드 기준)로 계산
      // 일단 여기서는 0으로 설정
      totals.avgRevenuePerPatient = 0;

      console.log('[Statistics] Totals (before newPatientsCount):', {
        monthPatients: totals.monthPatients,
        monthlyRevenue: totals.monthlyRevenue,
        avgRevenuePerPatient: totals.avgRevenuePerPatient
      });

      setManagerStats(statsArray);
      setTotalStats(totals);

      // 새로운 통계 계산 로직 추가
      // 1. 아웃 환자 수 - 전체 기간 아웃 + 아웃위기 환자
      let outStatusQuery = supabase
        .from('patients')
        .select('id')
        .in('management_status', ['아웃', '아웃위기']);
      
      // 담당자 필터 적용 (일반 매니저 또는 특정 매니저 선택 시)
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        outStatusQuery = outStatusQuery.eq('assigned_manager', targetManager);
      }
      
      // 지점 필터 적용
      outStatusQuery = applyBranchFilter(outStatusQuery);
      
      const { data: outPatients } = await outStatusQuery;
      const outPatientsCount = outPatients?.length || 0;

      // 2. 유입률 (해당 월 기준, inflow_status가 '유입'인 환자)
      // 초진관리와 동일: inflow_date가 없으면 created_at 사용
      let inflowQuery = supabase
        .from('patients')
        .select('id, inflow_date, created_at')
        .eq('inflow_status', '유입')
        .eq('management_status', '관리 중');
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        inflowQuery = inflowQuery.eq('assigned_manager', targetManager);
      }
      inflowQuery = applyBranchFilter(inflowQuery);
      
      const { data: inflowPatients } = await inflowQuery;
      
      // 이미 위에서 계산한 날짜 범위 사용
      const newPatientsCount = inflowPatients?.filter(p => {
        const refDate = p.inflow_date ? new Date(p.inflow_date) : new Date(p.created_at);
        const refStartDate = selectedMonthStart;
        const refEndDate = endDate;
        return refDate >= refStartDate && refDate <= refEndDate;
      }).length || 0;

      // 객단가를 newPatientsCount(11월 유입환자) 기준으로 계산
      totals.avgRevenuePerPatient = newPatientsCount > 0
        ? Math.round(totals.monthlyRevenue / newPatientsCount)
        : 0;

      console.log('[Statistics] avgRevenuePerPatient updated:', {
        monthlyRevenue: totals.monthlyRevenue,
        newPatientsCount,
        avgRevenuePerPatient: totals.avgRevenuePerPatient
      });

      // 전화상담 환자 수 (해당 월 기준, inflow_status가 '전화상담'인 환자)
      // 초진관리와 동일: inflow_date가 없으면 created_at 사용
      let phoneConsultQuery = supabase
        .from('patients')
        .select('id, inflow_date, created_at')
        .eq('inflow_status', '전화상담')
        .eq('management_status', '관리 중');
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        phoneConsultQuery = phoneConsultQuery.eq('assigned_manager', targetManager);
      }
      phoneConsultQuery = applyBranchFilter(phoneConsultQuery);
      
      const { data: phoneConsultPatients } = await phoneConsultQuery;
      const phoneConsultCount = phoneConsultPatients?.filter(p => {
        const refDate = p.inflow_date ? new Date(p.inflow_date) : new Date(p.created_at);
        return refDate >= selectedMonthStart && refDate <= endDate;
      }).length || 0;

      // 방문상담 환자 수 (해당 월 기준, inflow_status가 '방문상담'인 환자)
      // 초진관리와 동일: inflow_date가 없으면 created_at 사용
      let visitConsultQuery = supabase
        .from('patients')
        .select('id, inflow_date, created_at')
        .eq('inflow_status', '방문상담')
        .eq('management_status', '관리 중');
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        visitConsultQuery = visitConsultQuery.eq('assigned_manager', targetManager);
      }
      visitConsultQuery = applyBranchFilter(visitConsultQuery);
      
      const { data: visitConsultPatients } = await visitConsultQuery;
      const visitConsultCount = visitConsultPatients?.filter(p => {
        const refDate = p.inflow_date ? new Date(p.inflow_date) : new Date(p.created_at);
        return refDate >= selectedMonthStart && refDate <= endDate;
      }).length || 0;

      // 실패 환자 수 (해당 월 기준, inflow_status가 '실패'인 환자)
      // 초진관리와 동일: inflow_date가 없으면 created_at 사용
      let failedQuery = supabase
        .from('patients')
        .select('id, inflow_date, created_at')
        .eq('inflow_status', '실패')
        .eq('management_status', '관리 중');
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        failedQuery = failedQuery.eq('assigned_manager', targetManager);
      }
      failedQuery = applyBranchFilter(failedQuery);
      
      const { data: failedPatients } = await failedQuery;
      const failedCount = failedPatients?.filter(p => {
        const refDate = p.inflow_date ? new Date(p.inflow_date) : new Date(p.created_at);
        return refDate >= selectedMonthStart && refDate <= endDate;
      }).length || 0;

      // 3. 재진관리비율 계산
      const [prevYear, prevMonth] = selectedMonth.split('-').map(Number);
      const prevMonthDate = new Date(prevYear, prevMonth - 2, 1);
      const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
      
      // 이전 달 유입 환자를 위한 별도 쿼리
      let prevMonthQuery = supabase
        .from('patients')
        .select('id, inflow_date, created_at, management_status');
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        prevMonthQuery = prevMonthQuery.eq('assigned_manager', targetManager);
      }
      prevMonthQuery = applyBranchFilter(prevMonthQuery);
      
      const { data: prevMonthPatientsData } = await prevMonthQuery;
      
      // 이전 달 유입 환자 (inflow_date 기준, 없으면 created_at)
      const prevMonthPatients = prevMonthPatientsData?.filter(p => {
        const inflowDate = p.inflow_date ? new Date(p.inflow_date) : new Date(p.created_at);
        const inflowYearMonth = `${inflowDate.getFullYear()}-${String(inflowDate.getMonth() + 1).padStart(2, '0')}`;
        return inflowYearMonth === prevMonthStr;
      }) || [];

      // 현재 달에 활동한 환자 ID 목록
      const activePatientIds = new Set(dailyStatuses?.map(s => s.patient_id) || []);
      
      // 이전 달 유입 중 현재 달에 활동한 환자
      const retainedPatients = prevMonthPatients.filter(p => activePatientIds.has(p.id)).length;
      const retentionRate = prevMonthPatients.length > 0 
        ? Math.round((retainedPatients / prevMonthPatients.length) * 100) 
        : 0;

      // 4. 관리 기간별 환자 수 - 선택한 월의 말일 기준, 독립 구간
      // 각 기간의 기준일 계산 (선택한 월의 말일 기준)
      const periodMonthEnd = new Date(year, month, 0); // 선택한 월의 마지막 날
      const oneMonthAgoPeriod = new Date(year, month - 1, 0); // 1개월 전 말일
      const twoMonthsAgoPeriod = new Date(year, month - 2, 0); // 2개월 전 말일
      const threeMonthsAgoPeriod = new Date(year, month - 3, 0); // 3개월 전 말일
      const sixMonthsAgoPeriod = new Date(year, month - 6, 0); // 6개월 전 말일

      // 관리 중 환자만 조회 (inflow_date 필수)
      let managedPatientsQuery = supabase
        .from('patients')
        .select('id, inflow_date, name')
        .eq('management_status', '관리 중')
        .not('inflow_date', 'is', null); // inflow_date가 반드시 있어야 함
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        managedPatientsQuery = managedPatientsQuery.eq('assigned_manager', targetManager);
      }
      managedPatientsQuery = applyBranchFilter(managedPatientsQuery);
      
      const { data: activePatients } = await managedPatientsQuery;

      // 각 구간을 독립적으로 계산 (중복 없음)
      // 1개월 이상: 1개월 전 말일 <= 유입일 < 선택한 월 말일 (1~2개월 사이)
      const patients1MonthPlus = (activePatients || []).filter(p => {
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= oneMonthAgoPeriod && inflowDate < periodMonthEnd;
      }).length;

      // 2개월 이상: 2개월 전 말일 <= 유입일 < 1개월 전 말일 (2~3개월 사이)
      const patients2MonthPlus = (activePatients || []).filter(p => {
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= twoMonthsAgoPeriod && inflowDate < oneMonthAgoPeriod;
      }).length;

      // 3개월 이상: 3개월 전 말일 <= 유입일 < 2개월 전 말일 (3~6개월 사이)
      const patients3MonthPlus = (activePatients || []).filter(p => {
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= threeMonthsAgoPeriod && inflowDate < twoMonthsAgoPeriod;
      }).length;

      // 6개월 이상: 유입일 < 6개월 전 말일 (6개월 이상 전체)
      const patients6MonthPlus = (activePatients || []).filter(p => {
        const inflowDate = new Date(p.inflow_date);
        return inflowDate < sixMonthsAgoPeriod;
      }).length;

      // 치료동의율 계산
      // 치료 동의 대상 = 신규등록 - 전화상담 - 방문상담
      // 치료동의율 = (치료 동의 대상 - 실패) / 치료 동의 대상 × 100
      const treatmentDecisionTarget = totals.monthPatients - phoneConsultCount - visitConsultCount;
      const treatmentAgreementRate = treatmentDecisionTarget > 0 
        ? Math.round(((treatmentDecisionTarget - failedCount) / treatmentDecisionTarget) * 100) 
        : 0;

      // 유입상태='유입'인데 유입일(inflow_date) 미등록 환자
      let missingInflowQuery = supabase
        .from('patients')
        .select('id')
        .eq('inflow_status', '유입')
        .is('inflow_date', null);
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        missingInflowQuery = missingInflowQuery.eq('assigned_manager', targetManager);
      }
      missingInflowQuery = applyBranchFilter(missingInflowQuery);
      
      const { data: missingInflowPatients } = await missingInflowQuery;
      const missingInflowDatePatients = missingInflowPatients?.length || 0;

      setAdditionalStats({
        outPatients: outPatientsCount,
        newPatientsThisMonth: newPatientsCount,
        phoneConsultPatientsThisMonth: phoneConsultCount,
        visitConsultPatientsThisMonth: visitConsultCount,
        failedPatientsThisMonth: failedCount,
        retentionRate,
        treatmentAgreementRate,
        missingInflowDatePatients,
        patients1MonthPlus,
        patients2MonthPlus,
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

  const handlePeriodCardClick = async (period: '1month' | '2month' | '3month' | '6month') => {
    if (!user) return;

    try {
      // 선택한 월의 말일 기준으로 계산
      const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
      const periodMonthEnd = new Date(selectedYear, selectedMonthNum, 0); // 선택한 월의 마지막 날
      const oneMonthAgoPeriod = new Date(selectedYear, selectedMonthNum - 1, 0); // 1개월 전 말일
      const twoMonthsAgoPeriod = new Date(selectedYear, selectedMonthNum - 2, 0); // 2개월 전 말일
      const threeMonthsAgoPeriod = new Date(selectedYear, selectedMonthNum - 3, 0); // 3개월 전 말일
      const sixMonthsAgoPeriod = new Date(selectedYear, selectedMonthNum - 6, 0); // 6개월 전 말일
      
      let startDate: Date;
      let endDate: Date;
      
      if (period === '1month') {
        // 1개월 이상: 1개월 전 말일 <= 유입일 < 선택한 월 말일
        startDate = oneMonthAgoPeriod;
        endDate = periodMonthEnd;
      } else if (period === '2month') {
        // 2개월 이상: 2개월 전 말일 <= 유입일 < 1개월 전 말일
        startDate = twoMonthsAgoPeriod;
        endDate = oneMonthAgoPeriod;
      } else if (period === '3month') {
        // 3개월 이상: 3개월 전 말일 <= 유입일 < 2개월 전 말일
        startDate = threeMonthsAgoPeriod;
        endDate = twoMonthsAgoPeriod;
      } else {
        // 6개월 이상: 유입일 < 6개월 전 말일
        startDate = new Date(1900, 0, 1); // 매우 오래된 날짜
        endDate = sixMonthsAgoPeriod;
      }
      
      // 환자 데이터 조회 - 권한별로 필터링
      let query = supabase
        .from('patients')
        .select(`
          id,
          name,
          diagnosis_category,
          diagnosis_detail,
          assigned_manager,
          manager_name,
          inflow_date
        `)
        .eq('management_status', '관리 중')
        .not('inflow_date', 'is', null); // inflow_date 필수

      // 권한별 필터링
      if (!isMasterOrAdmin) {
        // 매니저는 자신의 환자만
        query = query.eq('assigned_manager', user.id);
      } else if (selectedManager !== 'all') {
        // 관리자/마스터가 특정 매니저 선택시
        query = query.eq('assigned_manager', selectedManager);
      }
      
      query = applyBranchFilter(query);

      const { data: allPatients, error } = await query;

      if (error) throw error;

      // 클라이언트 측에서 날짜 필터링 - 독립 구간
      const filteredPatients = (allPatients || []).filter(patient => {
        const inflowDate = new Date(patient.inflow_date);
        return inflowDate >= startDate && inflowDate < endDate;
      });

      setSelectedPeriodDialog({
        open: true,
        period,
        patients: filteredPatients
      });
    } catch (error) {
      console.error('Error fetching period patients:', error);
      toast({
        title: '오류',
        description: '환자 목록을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    }
  };

  const getPeriodTitle = (period: '1month' | '2month' | '3month' | '6month' | null) => {
    if (!period) return '';
    if (period === '1month') return '1~2개월 관리 환자';
    if (period === '2month') return '2~3개월 관리 환자';
    if (period === '3month') return '3~6개월 관리 환자';
    return '6개월 이상 관리 환자';
  };

  // 통계 카드 클릭 핸들러
  const handleStatsCardClick = async (type: 'out' | 'inflow' | 'phone' | 'visit' | 'failed' | 'retention' | 'missingInflow') => {
    try {
      // 선택한 월의 1일부터 오늘까지 (또는 해당 월 마지막까지)
      const [year2, month2] = selectedMonth.split('-').map(Number);
      const today2 = new Date();
      const isCurrentMonth2 = today2.getFullYear() === year2 && today2.getMonth() === month2 - 1;
      const startOfPeriod = new Date(year2, month2 - 1, 1);
      const endOfPeriod = isCurrentMonth2 ? today2 : new Date(year2, month2, 0);

      let query = applyBranchFilter(supabase.from('patients').select('*'));
      
      // 매니저 필터 적용
      if (selectedManager !== 'all') {
        query = query.eq('assigned_manager', selectedManager);
      }

      const { data: patients, error } = await query;

      if (error) throw error;

      let filteredPatients: any[] = [];
      let title = '';

      switch(type) {
        case 'out':
          // 아웃 환자 - 전체 기간 아웃 + 아웃위기 환자
          filteredPatients = patients?.filter(p => 
            p.management_status === '아웃' || p.management_status === '아웃위기'
          ) || [];
          title = '전체 기간 아웃/아웃위기 환자';
          break;
        
        case 'inflow':
          // 유입률 - 초진관리와 동일: inflow_date가 없으면 created_at 사용
          filteredPatients = patients?.filter(p => {
            if (p.inflow_status !== '유입') return false;
            const refDate = p.inflow_date ? new Date(p.inflow_date) : new Date(p.created_at);
            return refDate >= startOfPeriod && refDate <= endOfPeriod;
          }) || [];
          title = `유입률 - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
          break;
        
        case 'phone':
          // 전화상담 비율 - 초진관리와 동일: inflow_date가 없으면 created_at 사용
          filteredPatients = patients?.filter(p => {
            if (p.inflow_status !== '전화상담') return false;
            const refDate = p.inflow_date ? new Date(p.inflow_date) : new Date(p.created_at);
            return refDate >= startOfPeriod && refDate <= endOfPeriod;
          }) || [];
          title = `전화상담 비율 - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
          break;
        
        case 'visit':
          // 방문상담 비율 - 초진관리와 동일: inflow_date가 없으면 created_at 사용
          filteredPatients = patients?.filter(p => {
            if (p.inflow_status !== '방문상담') return false;
            const refDate = p.inflow_date ? new Date(p.inflow_date) : new Date(p.created_at);
            return refDate >= startOfPeriod && refDate <= endOfPeriod;
          }) || [];
          title = `방문상담 비율 - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
          break;
        
        case 'failed':
          // 실패율 - 초진관리와 동일: inflow_date가 없으면 created_at 사용
          filteredPatients = patients?.filter(p => {
            if (p.inflow_status !== '실패') return false;
            const refDate = p.inflow_date ? new Date(p.inflow_date) : new Date(p.created_at);
            return refDate >= startOfPeriod && refDate <= endOfPeriod;
          }) || [];
          title = `실패율 - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
          break;
        
        case 'retention':
          // 재진관리는 클릭해도 아무것도 안 함
          return;
        
        case 'missingInflow':
          // 유입상태='유입'인데 유입일 미등록 환자
          filteredPatients = patients?.filter(p => 
            p.inflow_status === '유입' && !p.inflow_date
          ) || [];
          title = '유입상태: 유입 / 유입일 미등록 환자';
          break;
      }

      setStatsDialog({
        open: true,
        type,
        title,
        patients: filteredPatients
      });
    } catch (error) {
      console.error('Error fetching stats patients:', error);
      toast({
        title: '오류',
        description: '환자 목록을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    }
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
        <h1 className="text-3xl font-bold text-gray-900">통계 관리</h1>
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

      {/* 첫 번째 줄: 총 관리 환자 / 누적 매출 / 당월 매출 / 당월 비급여 매출 / 평균 객단가 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 관리 환자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalPatients}명</div>
            <CardDescription className="text-xs mt-1">
              관리 중 상태 전체 환자
            </CardDescription>
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
            <CardTitle className="text-sm font-medium">당월 비급여 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.monthlyNonCoveredRevenue)}</div>
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

      {/* 두 번째 줄: 11월 신규 등록 / 11월 유입 환자 / 11월 치료동의율 / 11월 재진관리 비율 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedMonth.split('-')[1]}월 신규 등록
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalStats.monthPatients}명</div>
            <CardDescription className="text-xs mt-1">
              해당 월에 초진관리에 등록된 전체 환자
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleStatsCardClick('inflow')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{selectedMonth.split('-')[1]}월 유입 환자</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{additionalStats.newPatientsThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              치료동의, 결제완료
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{selectedMonth.split('-')[1]}월 치료동의율</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{additionalStats.treatmentAgreementRate}%</div>
            <CardDescription className="text-xs mt-1">
              신규등록 / 유입 환자
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{selectedMonth.split('-')[1]}월 재진관리비율</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{additionalStats.retentionRate}%</div>
            <CardDescription className="text-xs mt-1">
              전월 유입 중 당월 활동 비율
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* 세 번째 줄: 11월 전화상담 / 11월 방문상담 / 11월 실패 / 아웃 환자 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleStatsCardClick('phone')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{selectedMonth.split('-')[1]}월 전화상담</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{additionalStats.phoneConsultPatientsThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              유입상태='전화상담' 환자
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleStatsCardClick('visit')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{selectedMonth.split('-')[1]}월 방문상담</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{additionalStats.visitConsultPatientsThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              유입상태='방문상담' 환자
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleStatsCardClick('failed')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{selectedMonth.split('-')[1]}월 실패</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{additionalStats.failedPatientsThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              유입상태='실패' 환자
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleStatsCardClick('out')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">아웃 환자</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{additionalStats.outPatients}명</div>
            <CardDescription className="text-xs mt-1">
              전체 기간 아웃/아웃위기 환자
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleStatsCardClick('missingInflow')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">유입일 미등록</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{additionalStats.missingInflowDatePatients}명</div>
            <CardDescription className="text-xs mt-1">
              유입상태='유입' / 유입일 미등록
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* 관리 기간별 통계 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>관리 기간별 환자 현황</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedMonth}월 말 기준
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div 
              className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => handlePeriodCardClick('1month')}
            >
              <div className="text-xs text-gray-500 mb-1">1~2개월 관리 환자</div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">1개월대</span>
                <span className="text-2xl font-bold text-blue-600">{additionalStats.patients1MonthPlus}명</span>
              </div>
            </div>
            <div 
              className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => handlePeriodCardClick('2month')}
            >
              <div className="text-xs text-gray-500 mb-1">2~3개월 관리 환자</div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">2개월대</span>
                <span className="text-2xl font-bold text-green-600">{additionalStats.patients2MonthPlus}명</span>
              </div>
            </div>
            <div 
              className="p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
              onClick={() => handlePeriodCardClick('3month')}
            >
              <div className="text-xs text-gray-500 mb-1">3~6개월 관리 환자</div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">3개월대</span>
                <span className="text-2xl font-bold text-purple-600">{additionalStats.patients3MonthPlus}명</span>
              </div>
            </div>
            <div 
              className="p-4 bg-pink-50 rounded-lg cursor-pointer hover:bg-pink-100 transition-colors"
              onClick={() => handlePeriodCardClick('6month')}
            >
              <div className="text-xs text-gray-500 mb-1">6개월 이상 관리 환자</div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">6개월 이상</span>
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
                  <div className="flex justify-between items-center pl-4">
                    <span className="text-xs text-gray-500">입원 매출</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {formatCurrency(stats.inpatient_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pl-4">
                    <span className="text-xs text-gray-500">외래 매출</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(stats.outpatient_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pl-4">
                    <span className="text-xs text-gray-500">비급여 매출</span>
                    <span className="text-sm font-semibold text-orange-600">
                      {formatCurrency(stats.non_covered_revenue)}
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

      {/* 관리 기간별 환자 리스트 다이얼로그 */}
      <Dialog open={selectedPeriodDialog.open} onOpenChange={(open) => setSelectedPeriodDialog({ open, period: null, patients: [] })}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getPeriodTitle(selectedPeriodDialog.period)}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedPeriodDialog.patients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                해당 기간의 환자가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 pb-2 border-b font-semibold text-sm">
                  <div>환자명</div>
                  <div>질환</div>
                  <div>담당 매니저</div>
                  <div>유입일</div>
                </div>
                {selectedPeriodDialog.patients.map((patient) => (
                  <div key={patient.id} className="grid grid-cols-4 gap-4 py-3 border-b hover:bg-muted/50">
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {patient.diagnosis_category || patient.diagnosis_detail || '-'}
                    </div>
                    <div className="text-sm">
                      {patient.manager_name || '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {patient.inflow_date || patient.consultation_date 
                        ? new Date(patient.inflow_date || patient.consultation_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 통계 카드 클릭 환자 리스트 다이얼로그 */}
      <Dialog open={statsDialog.open} onOpenChange={(open) => setStatsDialog({ open, type: null, title: '', patients: [] })}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{statsDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {statsDialog.patients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                해당하는 환자가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-4 pb-2 border-b font-semibold text-sm">
                  <div>환자명</div>
                  <div>질환</div>
                  <div>담당 매니저</div>
                  <div>관리 상태</div>
                  <div>유입일</div>
                </div>
                {statsDialog.patients.map((patient) => (
                  <div key={patient.id} className="grid grid-cols-5 gap-4 py-3 border-b hover:bg-muted/50">
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {patient.diagnosis_category || patient.diagnosis_detail || '-'}
                    </div>
                    <div className="text-sm">
                      {patient.manager_name || '-'}
                    </div>
                    <div className="text-sm">
                      {patient.management_status || '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {patient.inflow_date || patient.consultation_date 
                        ? new Date(patient.inflow_date || patient.consultation_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}