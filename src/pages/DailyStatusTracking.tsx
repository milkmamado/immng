import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyStatusGrid } from "@/components/DailyStatusGrid";
import { Calendar as CalendarIcon, Users, Activity, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { ko } from "date-fns/locale";

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
  patient_number: string;
  diagnosis?: string;
  detailed_diagnosis?: string;
  korean_doctor?: string;
  western_doctor?: string;
  manager_name?: string;
  previous_hospital?: string;
  memo1?: string;
  memo2?: string;
  admission_cycles?: AdmissionCycle[];
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
    총환자: 0,
    입원: 0,
    외래: 0,
    전화FU: 0
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
        patient.patient_number.toLowerCase().includes(search)
      );
      setFilteredPatients(filtered);
    }
  }, [patients, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 먼저 관리 중인 환자 상태 옵션 가져오기
      const { data: statusOptions } = await supabase
        .from('patient_status_options')
        .select('name')
        .eq('exclude_from_daily_tracking', false);

      const includedStatuses = statusOptions?.map(opt => opt.name) || ['관리 중'];

      // 환자 목록 가져오기 (유입 상태 + 관리 중인 상태만)
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select(`
          id, name, patient_number, diagnosis, detailed_diagnosis, 
          korean_doctor, western_doctor, manager_name, previous_hospital, 
          memo1, memo2,
          admission_cycles (
            id, admission_date, discharge_date, admission_type, status
          )
        `)
        .eq('inflow_status', '유입')
        .in('management_status', includedStatuses)
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      // 선택된 월의 시작일
      const [year, month] = selectedMonth.split('-');
      const monthStartDate = `${year}-${month}-01`;

      // 각 환자에 대해 해당 월 이전에 퇴원했는지 확인
      const activePatientsPromises = (patientsData || []).map(async (patient) => {
        // 해당 월 시작일 이전의 마지막 상태 확인
        const { data: lastStatusBeforeMonth } = await supabase
          .from('daily_patient_status')
          .select('status_type, status_date')
          .eq('patient_id', patient.id)
          .lt('status_date', monthStartDate)
          .order('status_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 이전 달에 퇴원 상태였다면 제외
        if (lastStatusBeforeMonth && lastStatusBeforeMonth.status_type === '퇴원') {
          return null;
        }

        return patient;
      });

      const activePatients = (await Promise.all(activePatientsPromises)).filter(p => p !== null);
      setPatients(activePatients);

      // 선택된 월의 일별 상태 가져오기
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      const { data: statusData, error: statusError } = await supabase
        .from('daily_patient_status')
        .select('*')
        .gte('status_date', startDate)
        .lte('status_date', endDate);

      if (statusError) throw statusError;
      setDailyStatuses(statusData || []);

      // 통계 계산: 각 환자의 해당 월 최신 상태만 카운트
      const latestStatusByPatient = new Map<string, DailyStatus>();
      (statusData || []).forEach(status => {
        const existing = latestStatusByPatient.get(status.patient_id);
        if (!existing || status.status_date > existing.status_date) {
          latestStatusByPatient.set(status.patient_id, status);
        }
      });

      // 최신 상태만으로 통계 계산
      const statusCounts = Array.from(latestStatusByPatient.values()).reduce((acc, status) => {
        acc[status.status_type] = (acc[status.status_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setStats({
        총환자: activePatients.length || 0,
        입원: statusCounts['입원'] || 0,
        외래: statusCounts['외래'] || 0,
        전화FU: statusCounts['전화F/U'] || 0
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

        toast({
          title: "성공",
          description: "상태가 삭제되었습니다.",
        });
      } else {
        // 상태가 있으면 업데이트/삽입
        const { error } = await supabase
          .from('daily_patient_status')
          .upsert({
            patient_id: patientId,
            status_date: date,
            status_type: statusType,
            notes: notes || null,
            created_by: user.id
          }, {
            onConflict: 'patient_id,status_date'
          });

        if (error) {
          console.error('Upsert error:', error);
          throw error;
        }

        toast({
          title: "성공",
          description: "상태가 업데이트되었습니다.",
        });
      }

      fetchData(); // 데이터 새로고침
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
              placeholder="환자명, 등록번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">총 환자</p>
              <p className="text-2xl font-bold">{stats.총환자}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">입원</p>
              <p className="text-2xl font-bold text-red-600">{stats.입원}</p>
            </div>
            <Badge variant="destructive" className="h-8 w-8 rounded-full flex items-center justify-center">
              입
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">외래</p>
              <p className="text-2xl font-bold text-green-600">{stats.외래}</p>
            </div>
            <Badge variant="default" className="h-8 w-8 rounded-full flex items-center justify-center">
              외
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">전화F/U</p>
              <p className="text-2xl font-bold text-blue-600">{stats.전화FU}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
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
          />
        </CardContent>
      </Card>
    </div>
  );
}