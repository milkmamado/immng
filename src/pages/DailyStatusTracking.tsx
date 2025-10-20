import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyStatusGrid } from "@/components/DailyStatusGrid";
import { Calendar as CalendarIcon, Users, Activity, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { ko } from "date-fns/locale";
import { calculateDaysSinceLastCheck, calculateAutoManagementStatus, shouldAutoUpdateStatus } from "@/utils/patientStatusUtils";

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

  useEffect(() => {
    fetchData();

    // Realtime 구독 설정 - patients 테이블 변경 감지
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
          korean_doctor, western_doctor, manager_name, hospital_category, hospital_branch,
          management_status, created_at, resident_number_masked, phone, gender, age,
          visit_motivation, address, crm_memo, special_note_1, special_note_2,
          treatment_memo_1, treatment_memo_2, last_visit_date, diet_info,
          patient_or_guardian, inflow_status, visit_type, guardian_name,
          guardian_relationship, guardian_phone, insurance_type, hospital_treatment,
          examination_schedule, payment_amount, memo1,
          admission_cycles (
            id, admission_date, discharge_date, admission_type, status
          )
        `)
        .eq('inflow_status', '유입')
        .order('created_at', { ascending: false });

      // 최종 상태(사망, 상태악화, 치료종료) 및 "아웃", "아웃위기" 환자 제외
      const { data: patientsData, error: patientsError } = await patientsQuery
        .not('management_status', 'in', '("사망","상태악화","치료종료","아웃","아웃위기")');

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
        
        // 자동 업데이트 가능 여부 확인 (최종 상태 제외)
        if (!shouldAutoUpdateStatus(patient.management_status, false)) {
          continue;
        }

        // 마지막 체크로부터 경과 일수 계산
        const daysSinceCheck = calculateDaysSinceLastCheck(lastCheckDate, patient.created_at);
        
        // 경과 일수에 따른 새 상태 계산
        const newManagementStatus = calculateAutoManagementStatus(daysSinceCheck);

        // management_status가 변경되었으면 업데이트
        if (patient.management_status !== newManagementStatus) {
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
    }
  };

  const handleMemoUpdate = async (patientId: string, memoType: 'memo1' | 'memo2', value: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ [memoType]: value })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "성공",
        description: "메모가 저장되었습니다.",
      });

      fetchData(); // 데이터 새로고침
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
        const { data, error } = await supabase
          .from('daily_patient_status')
          .upsert({
            patient_id: patientId,
            status_date: date,
            status_type: statusType,
            notes: notes || null,
            created_by: user.id
          }, {
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

        toast({
          title: "성공",
          description: "상태가 업데이트되었습니다.",
        });
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
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1, 1);
    newDate.setMonth(newDate.getMonth() - 1);
    const newYearMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newYearMonth);
    setCalendarDate(newDate);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1, 1);
    newDate.setMonth(newDate.getMonth() + 1);
    const newYearMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newYearMonth);
    setCalendarDate(newDate);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">일별 환자 상태 추적</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="환자명, 등록번호, 담당자, 주치의, 이전병원으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
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
              <PopoverContent className="w-auto p-0" align="end">
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
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
      />
        </CardContent>
      </Card>
    </div>
  );
}