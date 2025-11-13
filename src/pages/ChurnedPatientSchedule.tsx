import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyStatusGrid } from "@/components/DailyStatusGrid";
import { Calendar as CalendarIcon, Users, Search, ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { ko } from "date-fns/locale";
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

export default function ChurnedPatientSchedule() {
  const { applyBranchFilter } = useBranchFilter();
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
  const { toast } = useToast();
  const scrollPositionRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);

  useEffect(() => {
    fetchData();

    // Realtime 구독 설정
    const channel = supabase
      .channel('churned-patient-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          console.log('Patient data changed:', payload);
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
          fetchData();
        }
      )
      .subscribe();

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
      // 아웃, 아웃위기 환자만 가져오기
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
        .in('management_status', ['아웃', '아웃위기'])
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      
      // 지점 필터 적용
      patientsQuery = applyBranchFilter(patientsQuery);
      
      const { data: patientsData, error: patientsError } = await patientsQuery;

      if (patientsError) throw patientsError;

      setPatients(patientsData || []);

      // 전체 일별 상태 가져오기
      const { data: fullStatusData, error: fullStatusError } = await supabase
        .from('daily_patient_status')
        .select('*')
        .order('status_date', { ascending: true });

      if (fullStatusError) throw fullStatusError;

      setDailyStatuses(fullStatusData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "오류",
        description: "데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      const { error } = await supabase
        .from('patients')
        .update({ [memoType]: value })
        .eq('id', patientId);

      if (error) throw error;
      
      setPatients(prev => prev.map(patient => 
        patient.id === patientId 
          ? { ...patient, [memoType]: value }
          : patient
      ));
      
      toast({
        title: "성공",
        description: "메모가 저장되었습니다.",
      });
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

      fetchData();
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

      if (!statusType) {
        const { error } = await supabase
          .from('daily_patient_status')
          .delete()
          .eq('patient_id', patientId)
          .eq('status_date', date);

        if (error) throw error;

        setDailyStatuses(prev => prev.filter(s => !(s.patient_id === patientId && s.status_date === date)));

        toast({
          title: "성공",
          description: "상태가 삭제되었습니다.",
        });
      } else {
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

        if (error) throw error;

        if (data) {
          setDailyStatuses(prev => {
            const existingIndex = prev.findIndex(
              s => s.patient_id === patientId && s.status_date === date
            );
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = data;
              return updated;
            } else {
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
      const updates = newOrder.map((patientId, index) => 
        supabase
          .from('patients')
          .update({ display_order: index })
          .eq('id', patientId)
      );

      await Promise.all(updates);

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
      
      const headers = ['환자명', '담당자', '진단', '관리상태', '메모'];
      for (let day = 1; day <= daysInMonth; day++) {
        headers.push(`${day}일`);
      }
      
      const data = filteredPatients.map(patient => {
        const row: any = {
          '환자명': patient.name || '-',
          '담당자': patient.manager_name || '-',
          '진단': patient.diagnosis_detail || '-',
          '관리상태': patient.management_status || '-',
          '메모': patient.memo1 || '-'
        };
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
          const status = dailyStatuses.find(
            s => s.patient_id === patient.id && s.status_date === dateStr
          );
          row[`${day}일`] = status ? status.status_type : '';
        }
        
        return row;
      });
      
      const ws = XLSX.utils.json_to_sheet(data, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${year}년 ${month}월`);
      
      const colWidths = [
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 20 },
      ];
      for (let i = 0; i < daysInMonth; i++) {
        colWidths.push({ wch: 10 });
      }
      ws['!cols'] = colWidths;
      
      XLSX.writeFile(wb, `이탈환자_스케줄_${year}년_${month}월.xlsx`);
      
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
        <h1 className="text-3xl font-bold">이탈 환자 스케줄 확인</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">아웃위기 환자</p>
              <p className="text-2xl font-bold text-orange-600">
                {patients.filter(p => p.management_status === '아웃위기').length}
              </p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">아웃 환자</p>
              <p className="text-2xl font-bold text-red-600">
                {patients.filter(p => p.management_status === '아웃').length}
              </p>
            </div>
            <Users className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* 일별 상태 그리드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {selectedMonth.split('-')[0]}년 {selectedMonth.split('-')[1]}월 이탈 환자 스케줄
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
