import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyStatusGrid } from "@/components/DailyStatusGrid";
import { Calendar as CalendarIcon, Users, Activity, Search, ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { ko } from "date-fns/locale";
import { calculateDaysSinceLastCheck, calculateAutoManagementStatus, shouldAutoUpdateStatus } from "@/utils/patientStatusUtils";
import * as XLSX from 'xlsx';

interface AdmissionCycle {
  id: string;
  admission_date: string;
  discharge_date: string | null;
  admission_type: string;
  status: string;
}

interface Patient {
  id: string;
  name: string;
  customer_number?: string;
  
  diagnosis_category?: string;
  diagnosis_detail?: string;
  korean_doctor?: string;
  western_doctor?: string;
  manager_name?: string;
  hospital_category?: string;
  hospital_branch?: string;
  management_status?: string;
  created_at?: string;
  admission_cycles?: AdmissionCycle[];
  resident_number_masked?: string;
  phone?: string;
  gender?: string;
  age?: number;
  visit_motivation?: string;
  address?: string;
  inflow_date?: string;
  consultation_date?: string;
  crm_memo?: string;
  special_note_1?: string;
  special_note_2?: string;
  treatment_memo_1?: string;
  treatment_memo_2?: string;
  last_visit_date?: string;
  diet_info?: string;
  patient_or_guardian?: string;
  inflow_status?: string;
  visit_type?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  insurance_type?: string;
  hospital_treatment?: string;
  examination_schedule?: string;
  payment_amount?: number;
  memo1?: string;
}

interface DailyStatus {
  id: string;
  patient_id: string;
  status_date: string;
  status_type: string;
  notes?: string;
}

export default function DailyStatusTracking() {
  const { applyBranchFilter, currentBranch } = useBranchFilter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [dailyStatuses, setDailyStatuses] = useState<DailyStatus[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    당월총환자: 0,
    당월매출: 0,
    누적총매출: 0
  });
  const { toast } = useToast();
  const scrollPositionRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);

  useEffect(() => {
    fetchData();

    // Realtime 구독 설정 - patients 및 daily_patient_status 테이블 변경 감지
    const channel = supabase
      .channel('patient-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모두 감지
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          console.log('Patient data changed:', payload);
          // 데이터 변경 시 자동으로 다시 불러오기
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_patient_status'
        },
        (payload) => {
          console.log('Daily patient status changed:', payload);
          // 데이터 변경 시 자동으로 다시 불러오기
          fetchData();
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMonth]);

  // 검색어에 따른 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
    } else {
      const search = searchTerm.toLowerCase();
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(search) ||
        (patient.customer_number && patient.customer_number.toLowerCase().includes(search)) ||
        (patient.manager_name && patient.manager_name.toLowerCase().includes(search)) ||
        (patient.western_doctor && patient.western_doctor.toLowerCase().includes(search)) ||
        (patient.korean_doctor && patient.korean_doctor.toLowerCase().includes(search)) ||
        (patient.hospital_category && patient.hospital_category.toLowerCase().includes(search))
      );
      setFilteredPatients(filtered);
    }
  }, [patients, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 환자 목록 가져오기 (유입 상태이고 최종 상태가 아닌 환자만)
      let patientsQuery = supabase
        .from('patients')
        .select(`
          id, name, customer_number, diagnosis_category, diagnosis_detail, 
          korean_doctor, western_doctor, manager_name,
          management_status, created_at, phone, gender, age,
          visit_motivation, address,
          last_visit_date, diet_info,
          inflow_status, visit_type, guardian_name,
          guardian_relationship, guardian_phone, insurance_type,
          hospital_treatment, examination_schedule,
          payment_amount, display_order,
          inflow_date, consultation_date, memo1,
          special_note_1, special_note_2,
          treatment_memo_1, treatment_memo_2, crm_memo,
          hospital_category, hospital_branch,
          resident_number_masked,
          admission_cycles (
            id, admission_date, discharge_date, admission_type, status
          )
        `)
        .eq('inflow_status', '유입')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      // 최종 상태(사망, 상태악화, 치료종료) 및 "아웃", "아웃위기", "면책기간" 환자 제외
      patientsQuery = patientsQuery.not('management_status', 'in', '("사망","상태악화","치료종료","아웃","아웃위기","면책기간")');
      
      // 지점 필터 적용
      patientsQuery = applyBranchFilter(patientsQuery);
      
      const { data: patientsData, error: patientsError } = await patientsQuery;

      if (patientsError) throw patientsError;

      // 각 환자의 마지막 체크 날짜를 확인하여 management_status 자동 업데이트
      const { data: allStatusData } = await supabase
        .from('daily_patient_status')
        .select('patient_id, status_date')
        .order('status_date', { ascending: false });

      const lastCheckMap = new Map<string, string>();
      allStatusData?.forEach(status => {
        if (!lastCheckMap.has(status.patient_id)) {
          lastCheckMap.set(status.patient_id, status.status_date);
        }
      });

      // 각 환자의 상태를 자동으로 업데이트
      for (const patient of patientsData || []) {
        const lastCheckDate = lastCheckMap.get(patient.id);
        
        const autoUpdateAllowed = shouldAutoUpdateStatus(patient.management_status, false);
        
        // 자동 업데이트 가능 여부 확인 (최종 상태 제외)
        if (!autoUpdateAllowed) {
          console.log(`[DailyStatusTracking] "${patient.name}" (${patient.management_status}) 자동 업데이트 건너뜀`);
          continue;
        }

        // 마지막 체크로부터 경과 일수 계산 (우선순위: last_visit_date > inflow_date > created_at)
        const daysSinceCheck = calculateDaysSinceLastCheck(lastCheckDate, patient.created_at, patient.inflow_date);
        
        // 경과 일수에 따른 새 상태 계산
        const newManagementStatus = calculateAutoManagementStatus(daysSinceCheck);

        // management_status가 변경되었으면 업데이트
        if (patient.management_status !== newManagementStatus) {
          console.log(`[DailyStatusTracking] 자동 상태 변경: ${patient.name} ${patient.management_status} → ${newManagementStatus}`);
          await supabase
            .from("patients")
            .update({ management_status: newManagementStatus })
            .eq("id", patient.id);
          
          patient.management_status = newManagementStatus;
        }
      }

      // "아웃" 및 "아웃위기" 상태 환자는 제외 (관리 중만 필터링됨)

      // 선택된 월의 시작일
      const [year, month] = selectedMonth.split('-');
      const monthStartDate = `${year}-${month}-01`;

      // management_status가 "관리 중"이면 모두 표시
      setPatients(patientsData || []);

      // 전체 일별 상태 가져오기 (모든 월 - 색상 범례 연속성을 위해)
      const { data: fullStatusData, error: fullStatusError } = await supabase
        .from('daily_patient_status')
        .select('*')
        .order('status_date', { ascending: true });

      if (fullStatusError) throw fullStatusError;

      // 선택된 월의 일별 상태만 필터링 (표시용)
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      const currentMonthStatuses = (fullStatusData || []).filter(
        status => status.status_date >= startDate && status.status_date <= endDate
      );

      // 전체 데이터를 DailyStatusGrid에 전달 (색상 범례 계산용)
      setDailyStatuses(fullStatusData || []);

      // 통계 계산: 당월 매출 및 누적 총매출
      // 패키지 거래 내역 가져오기 (예치금 입금, 입원매출, 외래매출)
      const { data: packageTransactions } = await supabase
        .from('package_transactions')
        .select('transaction_date, amount, transaction_type')
        .in('transaction_type', ['deposit_in', 'inpatient_revenue', 'outpatient_revenue']);

      // 당월 패키지 매출 계산 (거래일자 기준)
      const currentMonthPackageRevenue = (packageTransactions || [])
        .filter(tx => tx.transaction_date && tx.transaction_date >= startDate && tx.transaction_date <= endDate)
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      // 누적 패키지 매출 계산 (전체 기간)
      const totalPackageRevenue = (packageTransactions || [])
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      setStats({
        당월총환자: patientsData?.length || 0,
        당월매출: currentMonthPackageRevenue,
        누적총매출: totalPackageRevenue
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "오류",
        description: "데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // 스크롤 위치 복원
      if (shouldRestoreScrollRef.current) {
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
          shouldRestoreScrollRef.current = false;
        }, 0);
      }
    }
  };

  const handleMemoUpdate = async (patientId: string, memoType: 'memo1' | 'memo2', value: string) => {
    try {
      console.log('handleMemoUpdate called:', { patientId, memoType, value });
      
      const { error } = await supabase
        .from('patients')
        .update({ [memoType]: value })
        .eq('id', patientId);

      if (error) {
        console.error('Error in DB update:', error);
        throw error;
      }

      console.log('Memo updated in DB successfully, updating local state...');
      
      // 로컬 상태만 업데이트 (fetchData 대신)
      setPatients(prev => prev.map(patient => 
        patient.id === patientId 
          ? { ...patient, [memoType]: value }
          : patient
      ));
      
      toast({
        title: "성공",
        description: "메모가 저장되었습니다.",
      });

      console.log('Local state updated for memo');
    } catch (error) {
      console.error('Error updating memo:', error);
      toast({
        title: "오류",
        description: "메모 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleManagementStatusUpdate = async (patientId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ management_status: status })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "성공",
        description: "관리 상태가 업데이트되었습니다.",
      });

      fetchData(); // 데이터 새로고침
    } catch (error) {
      console.error('Error updating management status:', error);
      toast({
        title: "오류",
        description: "관리 상태 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (patientId: string, date: string, statusType: string, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 해당 환자가 현재 사용자에게 할당되어 있는지 확인
      const patient = patients.find(p => p.id === patientId);
      if (!patient) {
        toast({
          title: "오류",
          description: "환자 정보를 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      // 상태가 빈 문자열이면 삭제
      if (!statusType) {
        const { error } = await supabase
          .from('daily_patient_status')
          .delete()
          .eq('patient_id', patientId)
          .eq('status_date', date);

        if (error) throw error;

        // 로컬 상태에서도 삭제
        setDailyStatuses(prev => prev.filter(s => !(s.patient_id === patientId && s.status_date === date)));

        toast({
          title: "성공",
          description: "상태가 삭제되었습니다.",
        });
      } else {
        // 상태가 있으면 업데이트/삽입
        const statusData: any = {
          patient_id: patientId,
          status_date: date,
          status_type: statusType,
          notes: notes || null,
          created_by: user.id,
          branch: currentBranch
        };

        const { data, error } = await supabase
          .from('daily_patient_status')
          .upsert(statusData, {
            onConflict: 'patient_id,status_date'
          })
          .select()
          .single();

        if (error) {
          console.error('Upsert error:', error);
          throw error;
        }

        // 로컬 상태 업데이트
        if (data) {
          setDailyStatuses(prev => {
            const existingIndex = prev.findIndex(
              s => s.patient_id === patientId && s.status_date === date
            );
            if (existingIndex >= 0) {
              // 기존 항목 업데이트
              const updated = [...prev];
              updated[existingIndex] = data;
              return updated;
            } else {
              // 새 항목 추가
              return [...prev, data];
            }
          });
        }

        // 🔥 부인과수술후회복 / 척추관절 환자가 퇴원하면 자동으로 치료종료 처리
        if (statusType === '퇴원' && 
            (patient.diagnosis_category === '부인과 수술 후 회복' || 
             patient.diagnosis_category === '척추관절')) {
          
          const { error: updateError } = await supabase
            .from('patients')
            .update({ management_status: '치료종료' })
            .eq('id', patientId);

          if (updateError) {
            console.error('Error auto-updating to 치료종료:', updateError);
          } else {
            // 로컬 상태 업데이트
            setPatients(prev => prev.map(p => 
              p.id === patientId 
                ? { ...p, management_status: '치료종료' }
                : p
            ));
            
            toast({
              title: "자동 처리 완료",
              description: "퇴원 처리되어 관리상태가 '치료종료'로 변경되었습니다.",
            });
          }
        } else {
          toast({
            title: "성공",
            description: "상태가 업데이트되었습니다.",
          });
        }
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      // RLS 오류 메시지를 사용자 친화적으로 변경
      const errorMessage = error?.message?.includes('row-level security') 
        ? "이 환자의 상태를 수정할 권한이 없습니다."
        : "상태 업데이트에 실패했습니다.";
      
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getDaysInMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  const handlePreviousMonth = () => {
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1, 1);
    newDate.setMonth(newDate.getMonth() - 1);
    const newYearMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newYearMonth);
    setCalendarDate(newDate);
  };

  const handleNextMonth = () => {
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1, 1);
    newDate.setMonth(newDate.getMonth() + 1);
    const newYearMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newYearMonth);
    setCalendarDate(newDate);
  };

  const handleOrderUpdate = async (newOrder: string[]) => {
    try {
      // 각 환자의 display_order 업데이트
      const updates = newOrder.map((patientId, index) => 
        supabase
          .from('patients')
          .update({ display_order: index })
          .eq('id', patientId)
      );

      await Promise.all(updates);

      // 로컬 상태도 업데이트
      const updatedPatients = [...patients].sort((a, b) => {
        const aIndex = newOrder.indexOf(a.id);
        const bIndex = newOrder.indexOf(b.id);
        return aIndex - bIndex;
      });
      setPatients(updatedPatients);

      toast({
        title: "성공",
        description: "환자 순서가 저장되었습니다.",
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "오류",
        description: "순서 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleExportToExcel = () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const daysInMonth = getDaysInMonth(selectedMonth);
      
      // 헤더 행 만들기
      const headers = ['환자명', '담당자', '진단', '관리상태', '메모'];
      for (let day = 1; day <= daysInMonth; day++) {
        headers.push(`${day}일`);
      }
      
      // 데이터 행 만들기
      const data = filteredPatients.map(patient => {
        const row: any = {
          '환자명': patient.name || '-',
          '담당자': patient.manager_name || '-',
          '진단': patient.diagnosis_category || '-',
          '관리상태': patient.management_status || '관리 중',
          '메모': patient.memo1 || '-'
        };
        
        // 각 날짜별 상태 추가
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
          const status = dailyStatuses.find(
            s => s.patient_id === patient.id && s.status_date === dateStr
          );
          row[`${day}일`] = status ? status.status_type : '';
        }
        
        return row;
      });
      
      // 워크북 생성
      const ws = XLSX.utils.json_to_sheet(data, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${year}년 ${month}월`);
      
      // 컬럼 너비 설정
      const colWidths = [
        { wch: 12 }, // 환자명
        { wch: 12 }, // 담당자
        { wch: 15 }, // 진단
        { wch: 12 }, // 관리상태
        { wch: 20 }, // 메모
      ];
      for (let i = 0; i < daysInMonth; i++) {
        colWidths.push({ wch: 10 }); // 날짜 컬럼
      }
      ws['!cols'] = colWidths;
      
      // 파일 다운로드
      XLSX.writeFile(wb, `환자_상태_추적_${year}년_${month}월.xlsx`);
      
      toast({
        title: "성공",
        description: "엑셀 파일이 다운로드되었습니다.",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "오류",
        description: "엑셀 내보내기에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">일별 환자 상태 추적</h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={handleExportToExcel}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            엑셀 내보내기
          </Button>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="환자명, 등록번호, 담당자, 주치의, 이전병원으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* 월 네비게이션 - sticky */}
      <div className="sticky top-0 z-10 bg-background py-4 border-b shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePreviousMonth}
            aria-label="이전 월"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <CalendarIcon className="h-5 w-5" />
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-48">
                {selectedMonth.split('-')[0]}년 {selectedMonth.split('-')[1]}월
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={(date) => {
                  if (date) {
                    setCalendarDate(date);
                    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    setSelectedMonth(yearMonth);
                    setIsCalendarOpen(false);
                  }
                }}
                locale={ko}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2035}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNextMonth}
            aria-label="다음 월"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">당월 총 환자</p>
              <p className="text-2xl font-bold">{stats.당월총환자}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">당월 매출</p>
              <p className="text-2xl font-bold text-green-600">{stats.당월매출.toLocaleString()}원</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">누적 총매출</p>
              <p className="text-2xl font-bold text-primary">{stats.누적총매출.toLocaleString()}원</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* 일별 상태 그리드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {selectedMonth.split('-')[0]}년 {selectedMonth.split('-')[1]}월 환자 상태 추적
          </CardTitle>
        </CardHeader>
        <CardContent>
      <DailyStatusGrid
        patients={filteredPatients}
        dailyStatuses={dailyStatuses}
        yearMonth={selectedMonth}
        daysInMonth={getDaysInMonth(selectedMonth)}
        onStatusUpdate={handleStatusUpdate}
        onMemoUpdate={handleMemoUpdate}
        onManagementStatusUpdate={handleManagementStatusUpdate}
        onOrderUpdate={handleOrderUpdate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
      />
        </CardContent>
      </Card>
    </div>
  );
}