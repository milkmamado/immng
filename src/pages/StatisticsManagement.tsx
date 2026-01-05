import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Users, TrendingUp, DollarSign, Activity, Info } from 'lucide-react';

interface ManagerStats {
  manager_id: string;
  manager_name: string;
  total_patients: number;
  total_all_patients: number; // 전체 관리 중 환자 (기간 무관)
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
    outPatientsThisMonth: 0, // 11월 아웃 환자 (11월에 등록됐다가 아웃됨)
    newPatientsThisMonth: 0,
    totalNewRegistrations: 0, // 신규 등록 총 수 (치료동의율 계산용)
    phoneConsultPatientsThisMonth: 0,
    visitConsultPatientsThisMonth: 0,
    failedPatientsThisMonth: 0,
    treatmentCompletedThisMonth: 0, // 11월 치료종료 환자
    retentionRate: 0,
    prevMonthInflowTotal: 0, // 전월 유입 총 수 (재진관리비율 계산용)
    retainedPatientsCount: 0, // 전월 유입 중 현재 관리 중인 환자 수
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
    type: 'out' | 'outThisMonth' | 'totalOut' | 'inflow' | 'phone' | 'visit' | 'failed' | 'treatmentCompleted' | 'retention' | 'missingInflow' | 'newRegistration' | null;
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
    if (!user) return;

    // 관리자/마스터는 매니저 목록이 먼저 로딩된 후에만 통계를 조회하도록 보호
    if (isMasterOrAdmin) {
      if (selectedManager === 'all' && managers.length === 0) {
        // 전체 보기인데 아직 매니저 목록을 못 불러온 상태면 대기
        return;
      }

      if (selectedManager !== 'all' && managers.length === 0) {
        // 특정 실장 보기인데 매니저 목록이 비어 있으면 역시 대기
        return;
      }
    }

    if (isMasterOrAdmin || selectedManager !== 'all') {
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
  }, [selectedMonth, selectedManager, user, isMasterOrAdmin, managers]);

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
      
      // 로컬 날짜 형식 사용 (toISOString()은 UTC로 변환되어 한국 시간대에서 하루 전이 됨)
      const queryStartDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const queryEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      // 공통 필터 조건 생성
      const targetManager = isMasterOrAdmin && selectedManager !== 'all' ? selectedManager : (isMasterOrAdmin ? null : user?.id);

      // 1. 해당 월 신규 등록 환자: inflow_date 또는 consultation_date가 선택한 월에 있는 환자
      let monthNewPatientsQuery = supabase
        .from('patients')
        .select('id, assigned_manager, manager_name, payment_amount, inflow_date, consultation_date, inflow_status');

      // 일반 매니저는 본인 환자만, 마스터/관리자가 특정 매니저 선택 시 해당 매니저만
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        monthNewPatientsQuery = monthNewPatientsQuery.eq('assigned_manager', targetManager);
      }
      
      // 지점 필터 적용
      monthNewPatientsQuery = applyBranchFilter(monthNewPatientsQuery);

      const { data: allMonthPatients, error: monthPatientsError } = await monthNewPatientsQuery;

      if (monthPatientsError) throw monthPatientsError;

      // 선택한 월에 신규 등록된 환자 필터링
      // - 모든 상태: inflow_date 기준만 사용
      console.log('[통계관리] 신규 등록 필터 전:', {
        totalCount: allMonthPatients?.length,
        selectedMonthStart,
        endDate,
        selectedMonth,
        sample: allMonthPatients?.slice(0, 3).map(p => ({ id: p.id, inflow_date: p.inflow_date }))
      });
      
      const monthNewPatients = allMonthPatients?.filter(p => {
        if (!p.inflow_date) return false;
        const inflowDate = new Date(p.inflow_date);
        const included = inflowDate >= selectedMonthStart && inflowDate <= endDate;
        return included;
      });
      
      console.log('[통계관리] 신규 등록 결과:', monthNewPatients?.length);

      // 2. 해당 월 관리 환자: 선택한 월에 유입되어 현재 '관리 중'인 환자 (유입일 필수)
      let totalPatientsQuery = supabase
        .from('patients')
        .select('id, assigned_manager, manager_name, inflow_date')
        .eq('management_status', '관리 중')
        .not('inflow_date', 'is', null); // 유입일 필수

      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        totalPatientsQuery = totalPatientsQuery.eq('assigned_manager', targetManager);
      }
      
      totalPatientsQuery = applyBranchFilter(totalPatientsQuery);
      
      const { data: totalPatientsData } = await totalPatientsQuery;
      
      // 선택한 월에 유입된 환자만 필터링 (11월 관리 환자)
      const totalPatientsFiltered = totalPatientsData?.filter(p => {
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      });
      const totalPatientsCount = totalPatientsFiltered?.length || 0;

      // 전체 관리 중인 환자 (기간 무관)
      const totalAllPatientsCount = totalPatientsData?.length || 0;

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

      // 2-1. 해당 기간의 일별 상태 가져오기
      // ⚠️ 매니저별 분포는 patient.assigned_manager 를 통해 나누기 때문에
      // 여기서는 매니저로 미리 필터하지 않고, 지점/기간 기준으로만 가져온다.
      let dailyStatusesQuery = supabase
        .from('daily_patient_status')
        .select('patient_id, status_type, status_date')
        .gte('status_date', queryStartDate)
        .lte('status_date', queryEndDate)
        .order('status_date', { ascending: false });

      // 지점 필터 적용
      dailyStatusesQuery = applyBranchFilter(dailyStatusesQuery);

      const { data: dailyStatuses, error: statusError } = await dailyStatusesQuery;

      if (statusError) throw statusError;

      // 실장별로 그룹핑
      const managerMap = new Map<string, ManagerStats>();
      
      // 매니저별 신규 등록 환자 수 매핑 (모든 상태 포함)
      const managerNewRegistrationMap = new Map<string, number>();
      monthNewPatients?.forEach(patient => {
        const managerId = patient.assigned_manager;
        const managerName = patient.manager_name || '미지정';
        const currentCount = managerNewRegistrationMap.get(managerId) || 0;
        managerNewRegistrationMap.set(managerId, currentCount + 1);
        
        // 매니저 카드가 없으면 생성
        if (!managerMap.has(managerId)) {
          managerMap.set(managerId, {
            manager_id: managerId,
            manager_name: managerName,
            total_patients: 0,
            total_all_patients: 0,
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
      });
      
      // 모든 매니저 카드의 total_patients를 신규 등록 수로 설정
      for (const [managerId, count] of managerNewRegistrationMap.entries()) {
        const stats = managerMap.get(managerId);
        if (stats) {
          stats.total_patients = count;
        }
      }

      // 매니저 목록에는 있지만 신규 등록이 0명인 매니저도 카드 생성 (전체 관리 환자 집계 전에 실행!)
      if (isMasterOrAdmin) {
        if (selectedManager === 'all') {
          // 전체 보기: 모든 매니저 기본 카드 생성
          managers.forEach(manager => {
            if (!managerMap.has(manager.id)) {
              managerMap.set(manager.id, {
                manager_id: manager.id,
                manager_name: manager.name,
                total_patients: 0,
                total_all_patients: 0,
                total_revenue: 0,
                inpatient_revenue: 0,
                outpatient_revenue: 0,
                non_covered_revenue: 0,
                avg_revenue_per_patient: 0,
                status_breakdown: {
                  입원: 0,
                  외래: 0,
                  낮병동: 0,
                  전화FU: 0,
                }
              });
            }
          });
        } else if (selectedManager) {
          // 특정 실장 단독 보기: 선택된 실장 기본 카드도 미리 생성
          const managerInfo = managers.find(m => m.id === selectedManager);
          if (managerInfo && !managerMap.has(selectedManager)) {
            managerMap.set(selectedManager, {
              manager_id: selectedManager,
              manager_name: managerInfo.name,
              total_patients: 0,
              total_all_patients: 0,
              total_revenue: 0,
              inpatient_revenue: 0,
              outpatient_revenue: 0,
              non_covered_revenue: 0,
              avg_revenue_per_patient: 0,
              status_breakdown: {
                입원: 0,
                외래: 0,
                낮병동: 0,
                전화FU: 0,
              }
            });
          }
        }
      }

      // 전체 관리 중인 환자 수 집계 (기간 무관) - 모든 매니저 카드가 생성된 후 실행
      totalPatientsData?.forEach(patient => {
        const stats = managerMap.get(patient.assigned_manager);
        if (stats) {
          stats.total_all_patients += 1;
        }
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
          const patient = allMonthPatients?.find(p => p.assigned_manager === managerId);
          stats = {
            manager_id: managerId,
            manager_name: patient?.manager_name || '미지정',
            total_patients: 0,
            total_all_patients: 0,
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
      // 11월 기간 동안의 모든 상태 기록을 매니저별로 집계
      dailyStatuses?.forEach(status => {
        const patient = managerAllPatients?.find(p => p.id === status.patient_id);
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

      // 관리자/마스터가 특정 실장만 선택했는데 해당 기간 데이터가 전혀 없는 경우에도
      // 카드가 항상 보이도록 0값 기본 카드 생성
      let finalStatsArray = statsArray;
      if (isMasterOrAdmin && selectedManager !== 'all') {
        const hasSelectedManager = statsArray.some((s) => s.manager_id === selectedManager);
        if (!hasSelectedManager) {
          const managerInfo = managers.find((m) => m.id === selectedManager);
          if (managerInfo) {
            finalStatsArray = [
              ...statsArray,
              {
                manager_id: selectedManager,
                manager_name: managerInfo.name,
                total_patients: 0,
                total_all_patients: 0,
                total_revenue: 0,
                inpatient_revenue: 0,
                outpatient_revenue: 0,
                non_covered_revenue: 0,
                avg_revenue_per_patient: 0,
                status_breakdown: {
                  입원: 0,
                  외래: 0,
                  낮병동: 0,
                  전화FU: 0,
                },
              },
            ];
          }
        }
      }
      
      // 전체 통계 계산
      const totals = finalStatsArray.reduce((acc, stats) => ({
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

      totals.totalPatients = totalAllPatientsCount; // 유입일 정확히 입력된 전체 관리 중 환자
      totals.monthlyRevenue = monthlyRevenue; // 당월 매출 (입원+외래 총진료비)
      
      // 객단가 계산은 아래에서 newPatientsCount(11월 유입환자 카드 기준)로 계산
      // 일단 여기서는 0으로 설정
      totals.avgRevenuePerPatient = 0;

      console.log('[Statistics] Totals (before newPatientsCount):', {
        monthPatients: totals.monthPatients,
        monthlyRevenue: totals.monthlyRevenue,
        avgRevenuePerPatient: totals.avgRevenuePerPatient
      });

      setManagerStats(finalStatsArray);
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

      // 1-1. 11월 아웃 환자 - 11월에 신규 등록됐다가 현재 아웃/아웃위기인 환자
      let outThisMonthQuery = supabase
        .from('patients')
        .select('id, inflow_date, consultation_date, inflow_status')
        .in('management_status', ['아웃', '아웃위기']);
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        outThisMonthQuery = outThisMonthQuery.eq('assigned_manager', targetManager);
      }
      outThisMonthQuery = applyBranchFilter(outThisMonthQuery);
      
      const { data: outThisMonthPatients } = await outThisMonthQuery;
      
      // 11월에 등록된 환자 (inflow_date 기준만 사용)
      const outPatientsThisMonthCount = outThisMonthPatients?.filter(p => {
        if (!p.inflow_date) return false;
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 2. 11월 유입 환자 (inflow_status = '유입', management_status = '관리 중', inflow_date 필수)
      let inflowQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .eq('inflow_status', '유입')
        .eq('management_status', '관리 중')
        .not('inflow_date', 'is', null); // inflow_date가 반드시 있어야 함
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        inflowQuery = inflowQuery.eq('assigned_manager', targetManager);
      }
      inflowQuery = applyBranchFilter(inflowQuery);
      
      const { data: inflowPatients } = await inflowQuery;
      
      // 유입일이 해당 월에 속한 환자만 카운트
      const newPatientsCount = inflowPatients?.filter(p => {
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
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

      // 전화상담 환자 수 (inflow_status='전화상담' + consultation_date 필수)
      let phoneConsultQuery = supabase
        .from('patients')
        .select('id, consultation_date')
        .eq('inflow_status', '전화상담')
        .not('consultation_date', 'is', null); // 상담일이 반드시 있어야 함
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        phoneConsultQuery = phoneConsultQuery.eq('assigned_manager', targetManager);
      }
      phoneConsultQuery = applyBranchFilter(phoneConsultQuery);
      
      const { data: phoneConsultPatients } = await phoneConsultQuery;
      const phoneConsultCount = phoneConsultPatients?.filter(p => {
        const consultDate = new Date(p.consultation_date!);
        return consultDate >= selectedMonthStart && consultDate <= endDate;
      }).length || 0;

      // 방문상담 환자 수 (inflow_status='방문상담' + consultation_date 필수)
      let visitConsultQuery = supabase
        .from('patients')
        .select('id, consultation_date')
        .eq('inflow_status', '방문상담')
        .not('consultation_date', 'is', null); // 상담일이 반드시 있어야 함
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        visitConsultQuery = visitConsultQuery.eq('assigned_manager', targetManager);
      }
      visitConsultQuery = applyBranchFilter(visitConsultQuery);
      
      const { data: visitConsultPatients } = await visitConsultQuery;
      const visitConsultCount = visitConsultPatients?.filter(p => {
        const consultDate = new Date(p.consultation_date!);
        return consultDate >= selectedMonthStart && consultDate <= endDate;
      }).length || 0;

      // 실패 환자 수 (inflow_status='실패' + consultation_date 필수)
      let failedQuery = supabase
        .from('patients')
        .select('id, consultation_date')
        .eq('inflow_status', '실패')
        .not('consultation_date', 'is', null); // 상담일이 반드시 있어야 함
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        failedQuery = failedQuery.eq('assigned_manager', targetManager);
      }
      failedQuery = applyBranchFilter(failedQuery);
      
      const { data: failedPatients } = await failedQuery;
      const failedCount = failedPatients?.filter(p => {
        const consultDate = new Date(p.consultation_date!);
        return consultDate >= selectedMonthStart && consultDate <= endDate;
      }).length || 0;

      // 치료종료 환자 수 (inflow_status='유입' + management_status='치료종료' + inflow_date 필수)
      let treatmentCompletedQuery = supabase
        .from('patients')
        .select('id, inflow_date')
        .eq('inflow_status', '유입')
        .eq('management_status', '치료종료')
        .not('inflow_date', 'is', null); // 유입일이 반드시 있어야 함
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        treatmentCompletedQuery = treatmentCompletedQuery.eq('assigned_manager', targetManager);
      }
      treatmentCompletedQuery = applyBranchFilter(treatmentCompletedQuery);
      
      const { data: treatmentCompletedPatients } = await treatmentCompletedQuery;
      const treatmentCompletedCount = treatmentCompletedPatients?.filter(p => {
        const inflowDate = new Date(p.inflow_date!);
        return inflowDate >= selectedMonthStart && inflowDate <= endDate;
      }).length || 0;

      // 3. 재진관리비율 계산
      const [prevYear, prevMonth] = selectedMonth.split('-').map(Number);
      const prevMonthDate = new Date(prevYear, prevMonth - 2, 1);
      const prevMonthStart = new Date(prevYear, prevMonth - 2, 1);
      const prevMonthEnd = new Date(prevYear, prevMonth - 1, 0);
      
      // 전월 유입 환자: inflow_status='유입', inflow_date가 전월에 정확히 입력됨
      let prevMonthQuery = supabase
        .from('patients')
        .select('id, inflow_date, management_status')
        .eq('inflow_status', '유입')
        .not('inflow_date', 'is', null); // 유입일이 반드시 있어야 함
      
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        prevMonthQuery = prevMonthQuery.eq('assigned_manager', targetManager);
      }
      prevMonthQuery = applyBranchFilter(prevMonthQuery);
      
      const { data: prevMonthPatientsData } = await prevMonthQuery;
      
      // 전월에 유입일이 정확히 기재된 환자만 필터링
      const prevMonthPatients = prevMonthPatientsData?.filter(p => {
        const inflowDate = new Date(p.inflow_date);
        return inflowDate >= prevMonthStart && inflowDate <= prevMonthEnd;
      }) || [];

      // 전월 유입 환자 중 현재도 '관리 중' 또는 '치료종료'인 환자
      const retainedPatients = prevMonthPatients.filter(p => 
        p.management_status === '관리 중' || p.management_status === '치료종료'
      ).length;
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
      // 치료동의율 = (11월 유입 환자 수 + 11월 치료종료 환자 수) / (11월 신규 등록 수) × 100
      // - 분자: (inflow_status='유입' AND management_status='관리 중' AND inflow_date 정확) + (inflow_status='유입' AND management_status='치료종료' AND inflow_date 정확)
      // - 분모: inflow_date가 11월에 정확히 입력된 모든 환자 (monthNewPatients.length)
      const totalNewRegistrations = monthNewPatients?.length || 0;
      const treatmentAgreementRate = totalNewRegistrations > 0 
        ? Math.round(((newPatientsCount + treatmentCompletedCount) / totalNewRegistrations) * 100) 
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
        outPatientsThisMonth: outPatientsThisMonthCount, // 11월 아웃 환자
        newPatientsThisMonth: newPatientsCount,
        totalNewRegistrations, // 신규 등록 총 수 추가
        phoneConsultPatientsThisMonth: phoneConsultCount,
        visitConsultPatientsThisMonth: visitConsultCount,
        failedPatientsThisMonth: failedCount,
        treatmentCompletedThisMonth: treatmentCompletedCount, // 11월 치료종료 환자
        retentionRate,
        prevMonthInflowTotal: prevMonthPatients.length, // 전월 유입 총 수
        retainedPatientsCount: retainedPatients, // 전월 유입 중 현재 관리 중 또는 치료종료
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
  const handleStatsCardClick = async (type: 'out' | 'outThisMonth' | 'totalOut' | 'inflow' | 'phone' | 'visit' | 'failed' | 'treatmentCompleted' | 'retention' | 'missingInflow' | 'newRegistration') => {
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

        case 'totalOut':
          // 전체 아웃 - 전체 기간 아웃 + 아웃위기 환자 (same as 'out')
          filteredPatients = patients?.filter(p => 
            p.management_status === '아웃' || p.management_status === '아웃위기'
          ) || [];
          title = '전체 아웃 환자';
          break;
        
        case 'outThisMonth':
          // 11월 아웃 - 11월에 등록됐다가 현재 아웃/아웃위기인 환자
          filteredPatients = patients?.filter(p => {
            if (p.management_status !== '아웃' && p.management_status !== '아웃위기') return false;
            
            // 전화상담 또는 방문상담
            if (p.inflow_status === '전화상담' || p.inflow_status === '방문상담') {
              if (!p.consultation_date) return false;
              const consultDate = new Date(p.consultation_date);
              return consultDate >= startOfPeriod && consultDate <= endOfPeriod;
            }
            // 유입, 실패, 치료종료 등
            else {
              if (!p.inflow_date) return false;
              const inflowDate = new Date(p.inflow_date);
              return inflowDate >= startOfPeriod && inflowDate <= endOfPeriod;
            }
          }) || [];
          title = `${month2}월 아웃/아웃위기 환자 (등록일 기준) - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
          break;
        
        case 'inflow':
          // 11월 유입 환자 - inflow_status='유입', management_status='관리 중', inflow_date 필수
          filteredPatients = patients?.filter(p => {
            if (p.inflow_status !== '유입') return false;
            if (p.management_status !== '관리 중') return false;
            if (!p.inflow_date) return false; // 유입일이 반드시 있어야 함
            const inflowDate = new Date(p.inflow_date);
            return inflowDate >= startOfPeriod && inflowDate <= endOfPeriod;
          }) || [];
          title = `${month2}월 유입 환자 (유입상태/관리 중) - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
          break;
        
        case 'phone':
          // 11월 전화상담 - inflow_status='전화상담' + consultation_date 필수
          filteredPatients = patients?.filter(p => {
            if (p.inflow_status !== '전화상담') return false;
            if (!p.consultation_date) return false; // 상담일이 반드시 있어야 함
            const consultDate = new Date(p.consultation_date);
            return consultDate >= startOfPeriod && consultDate <= endOfPeriod;
          }) || [];
          title = `${month2}월 전화상담 환자 (상담일 기준) - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
          break;
        
        case 'visit':
          // 11월 방문상담 - inflow_status='방문상담' + consultation_date 필수
          filteredPatients = patients?.filter(p => {
            if (p.inflow_status !== '방문상담') return false;
            if (!p.consultation_date) return false; // 상담일이 반드시 있어야 함
            const consultDate = new Date(p.consultation_date);
            return consultDate >= startOfPeriod && consultDate <= endOfPeriod;
          }) || [];
          title = `${month2}월 방문상담 환자 (상담일 기준) - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
          break;
        
        case 'failed':
          // 11월 실패 - inflow_status='실패' + consultation_date 필수
          filteredPatients = patients?.filter(p => {
            if (p.inflow_status !== '실패') return false;
            if (!p.consultation_date) return false; // 상담일이 반드시 있어야 함
            const consultDate = new Date(p.consultation_date);
            return consultDate >= startOfPeriod && consultDate <= endOfPeriod;
          }) || [];
          title = `${month2}월 실패 환자 (상담일 기준) - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
          break;
        
        case 'treatmentCompleted':
          // 11월 치료종료 - inflow_status='유입' + management_status='치료종료' + inflow_date 필수
          filteredPatients = patients?.filter(p => {
            if (p.inflow_status !== '유입') return false;
            if (p.management_status !== '치료종료') return false;
            if (!p.inflow_date) return false; // 유입일이 반드시 있어야 함
            const inflowDate = new Date(p.inflow_date);
            return inflowDate >= startOfPeriod && inflowDate <= endOfPeriod;
          }) || [];
          title = `${month2}월 치료종료 환자 (유입일 기준) - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
          break;
        
        case 'retention':
          // 재진관리는 클릭해도 아무것도 안 함
          return;
        
        case 'missingInflow':
          // 유입일 미등록 환자
          filteredPatients = patients?.filter(p => 
            p.inflow_status === '유입' && !p.inflow_date
          ) || [];
          title = '유입일 미등록 환자';
          break;
        
        case 'newRegistration':
          // 신규 등록 환자 - 유입일이 해당 월에 정확하게 기재된 환자만 (다른 조건 없음)
          filteredPatients = patients?.filter(p => 
            p.inflow_date && // 유입일이 반드시 있어야 함
            new Date(p.inflow_date) >= startOfPeriod && 
            new Date(p.inflow_date) <= endOfPeriod
          ) || [];
          title = `${month2}월 신규 등록 환자 (유입일 기준) - ${month2}월 ${isCurrentMonth2 ? `1일~${today2.getDate()}일` : '전체'}`;
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
              유입상태='유입', 유입일 입력된 관리 중 환자
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
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleStatsCardClick('newRegistration')}>
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
              <div className="font-semibold text-foreground/80">(유입 환자 + 치료종료) ÷ 신규 등록 × 100</div>
              <div className="text-muted-foreground mt-0.5">
                ({additionalStats.newPatientsThisMonth}명 + {additionalStats.treatmentCompletedThisMonth}명 ÷ {additionalStats.totalNewRegistrations}명)
              </div>
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
              <div className="font-semibold text-foreground/80">전월 유입 중 (관리 중+치료종료) ÷ 전월 유입 × 100</div>
              <div className="text-muted-foreground mt-0.5">
                ({additionalStats.retainedPatientsCount}명 ÷ {additionalStats.prevMonthInflowTotal}명)
              </div>
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* 세 번째 줄: 11월 전화상담 / 11월 방문상담 / 11월 실패 / 11월 치료종료 / 11월 아웃 */}
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
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleStatsCardClick('treatmentCompleted')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{selectedMonth.split('-')[1]}월 치료종료</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{additionalStats.treatmentCompletedThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              유입상태='유입', 관리상태='치료종료', 유입일 기준
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleStatsCardClick('outThisMonth')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{selectedMonth.split('-')[1]}월 아웃</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{additionalStats.outPatientsThisMonth}명</div>
            <CardDescription className="text-xs mt-1">
              {selectedMonth.split('-')[1]}월 등록 후 아웃/아웃위기
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleStatsCardClick('totalOut')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 아웃</CardTitle>
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
      {((isMasterOrAdmin && managers.length > 0) || managerStats.length > 0) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(function getDisplayStats() {
              // 관리자/마스터가 특정 실장을 선택한 경우 해당 실장만 표시
              if (isMasterOrAdmin && selectedManager !== 'all') {
                const filtered = managerStats.filter((stats) => stats.manager_id === selectedManager);

                // 통계 배열에 선택한 실장 데이터가 전혀 없을 때도 카드가 보이도록
                if (filtered.length === 0) {
                  const managerInfo = managers.find((m) => m.id === selectedManager);
                  if (managerInfo) {
                    return [
                      {
                        manager_id: selectedManager,
                        manager_name: managerInfo.name,
                        total_patients: 0,
                        total_all_patients: 0,
                        total_revenue: 0,
                        inpatient_revenue: 0,
                        outpatient_revenue: 0,
                        non_covered_revenue: 0,
                        avg_revenue_per_patient: 0,
                        status_breakdown: {
                          입원: 0,
                          외래: 0,
                          낮병동: 0,
                          전화FU: 0,
                        },
                      },
                    ];
                  }
                }

                return filtered;
              }

              // 그 외의 경우 모두 표시 (전체 실장, 또는 매니저 본인)
              return managerStats;
            })().map((stats) => (
              <Card key={stats.manager_id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary to-medical-accent text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {stats.manager_name}
                  </CardTitle>
                  <CardDescription className="text-primary-light">
                    {selectedMonth.split('-')[1]}월 관리 환자 {stats.total_patients}명 / 전체 {stats.total_all_patients}명
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">총 매출</span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(stats.inpatient_revenue + stats.outpatient_revenue)}
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
            {statsDialog.type === 'phone' && (
              <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm font-semibold text-blue-900">
                  📋 집계 기준: 유입상태='전화상담' AND 상담일 정확히 입력됨
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  ⚠️ 상담일 미입력 시 통계에서 제외되니 반드시 입력해주세요!
                </p>
              </div>
            )}
            {statsDialog.type === 'visit' && (
              <div className="mt-2 p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                <p className="text-sm font-semibold text-orange-900">
                  📋 집계 기준: 유입상태='방문상담' AND 상담일 정확히 입력됨
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  ⚠️ 상담일 미입력 시 통계에서 제외되니 반드시 입력해주세요!
                </p>
              </div>
            )}
            {statsDialog.type === 'failed' && (
              <div className="mt-2 p-3 bg-gray-50 border-l-4 border-gray-500 rounded">
                <p className="text-sm font-semibold text-gray-900">
                  📋 집계 기준: 유입상태='실패' AND 상담일 정확히 입력됨
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  ⚠️ 상담일 미입력 시 통계에서 제외되니 반드시 입력해주세요!
                </p>
              </div>
            )}
            {statsDialog.type === 'newRegistration' && (
              <div className="mt-2 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                <p className="text-sm font-semibold text-amber-900">
                  📋 집계 기준: 유입일이 정확히 입력된 환자만 포함됩니다
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  ⚠️ 유입일 미입력 시 통계에서 제외되니 반드시 입력해주세요!
                </p>
              </div>
            )}
            {statsDialog.type === 'inflow' && (
              <div className="mt-2 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="text-sm font-semibold text-green-900">
                  📋 집계 기준: 유입상태='유입' AND 관리상태='관리 중' AND 유입일 정확히 입력됨
                </p>
                <p className="text-xs text-green-700 mt-1">
                  ⚠️ 유입일 미입력 또는 관리상태가 다른 경우 통계에서 제외됩니다!
                </p>
              </div>
            )}
          </DialogHeader>
          <div className="mt-4">
            {statsDialog.patients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                해당하는 환자가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                <div className={`grid ${(statsDialog.type === 'phone' || statsDialog.type === 'visit') ? 'grid-cols-4' : (statsDialog.type === 'failed' ? 'grid-cols-4' : 'grid-cols-5')} gap-4 pb-2 border-b font-semibold text-sm`}>
                  <div>환자명</div>
                  <div>질환</div>
                  <div>담당 매니저</div>
                  {(statsDialog.type !== 'phone' && statsDialog.type !== 'visit' && statsDialog.type !== 'failed') && <div>관리 상태</div>}
                  <div>
                    {(statsDialog.type === 'phone' || statsDialog.type === 'visit' || statsDialog.type === 'failed') ? '상담일' : '유입일'}
                  </div>
                </div>
                {statsDialog.patients.map((patient) => (
                  <div key={patient.id} className={`grid ${(statsDialog.type === 'phone' || statsDialog.type === 'visit') ? 'grid-cols-4' : (statsDialog.type === 'failed' ? 'grid-cols-4' : 'grid-cols-5')} gap-4 py-3 border-b hover:bg-muted/50`}>
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {patient.diagnosis_category || patient.diagnosis_detail || '-'}
                    </div>
                    <div className="text-sm">
                      {patient.manager_name || '-'}
                    </div>
                    {(statsDialog.type !== 'phone' && statsDialog.type !== 'visit' && statsDialog.type !== 'failed') && (
                      <div className="text-sm">
                        {patient.management_status || '-'}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {(statsDialog.type === 'phone' || statsDialog.type === 'visit' || statsDialog.type === 'failed')
                        ? (patient.consultation_date ? new Date(patient.consultation_date).toLocaleDateString('ko-KR') : '-')
                        : (patient.inflow_date 
                            ? new Date(patient.inflow_date).toLocaleDateString('ko-KR')
                            : '-')}
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