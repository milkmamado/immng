import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  diagnosis?: string;
  detailed_diagnosis?: string;
  korean_doctor?: string;
  western_doctor?: string;
  manager_name?: string;
  previous_hospital?: string;
  memo1?: string;
  memo2?: string;
  management_status?: string;
  admission_cycles?: AdmissionCycle[];
  resident_number_masked?: string;
  phone?: string;
  gender?: string;
  age?: number;
  visit_motivation?: string;
  address?: string;
  crm_memo?: string;
  last_visit_date?: string;
  diagnosis_category?: string;
  diagnosis_detail?: string;
  hospital_category?: string;
  hospital_branch?: string;
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
  created_at?: string;
}

interface DailyStatus {
  id: string;
  patient_id: string;
  status_date: string;
  status_type: string;
  notes?: string;
}

interface DailyStatusGridProps {
  patients: Patient[];
  dailyStatuses: DailyStatus[];
  yearMonth: string;
  daysInMonth: number;
  onStatusUpdate: (patientId: string, date: string, statusType: string, notes?: string) => Promise<void>;
  onMemoUpdate: (patientId: string, memoType: 'memo1' | 'memo2', value: string) => Promise<void>;
  onManagementStatusUpdate: (patientId: string, status: string) => Promise<void>;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function DailyStatusGrid({
  patients,
  dailyStatuses,
  yearMonth,
  daysInMonth,
  onStatusUpdate,
  onMemoUpdate,
  onManagementStatusUpdate,
  onPreviousMonth,
  onNextMonth,
}: DailyStatusGridProps) {
  const [selectedCell, setSelectedCell] = useState<{
    patientId: string;
    date: string;
    patient: Patient;
  } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [memoCell, setMemoCell] = useState<{
    patientId: string;
    memoType: 'memo1' | 'memo2';
    currentValue: string;
  } | null>(null);
  const [memoValue, setMemoValue] = useState<string>('');
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<any | null>(null);
  const [editingManagementStatus, setEditingManagementStatus] = useState<string>('');
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);
  const [patientStats, setPatientStats] = useState<{
    currentMonth: {
      admissionDays: number;
      dayCare: number;
      outpatient: number;
      phoneFollowUp: number;
      revenue: number;
    };
    total: {
      admissionDays: number;
      dayCare: number;
      outpatient: number;
      phoneFollowUp: number;
      revenue: number;
    };
  } | null>(null);
  const [editingFields, setEditingFields] = useState<Record<string, any>>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [diagnosisOptions, setDiagnosisOptions] = useState<any[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<any[]>([]);
  const [insuranceTypeOptions, setInsuranceTypeOptions] = useState<any[]>([]);
  const [patientStatusOptions, setPatientStatusOptions] = useState<any[]>([]);
  
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const statusTypes = ['입원', '퇴원', '재원', '낮병동', '외래', '기타', '전화F/U'];

  // 옵션 데이터 및 사용자 정보 가져오기
  useEffect(() => {
    fetchOptions();
    fetchCurrentUserName();
  }, []);

  const fetchOptions = async () => {
    try {
      const [diagnosis, hospital, insurance, patientStatus] = await Promise.all([
        supabase.from('diagnosis_options').select('*').order('name'),
        supabase.from('hospital_options').select('*').order('name'),
        supabase.from('insurance_type_options').select('*').order('name'),
        supabase.from('patient_status_options').select('*').order('name')
      ]);

      if (diagnosis.data) setDiagnosisOptions(diagnosis.data);
      if (hospital.data) setHospitalOptions(hospital.data);
      if (insurance.data) setInsuranceTypeOptions(insurance.data);
      if (patientStatus.data) setPatientStatusOptions(patientStatus.data);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchCurrentUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCurrentUserName(profile.name);
        }
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const updateEditingField = (field: string, value: any) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
    setSelectedPatientDetail((prev: any) => prev ? { ...prev, [field]: value } : null);
  };

  const saveAllEditingFields = async () => {
    if (!selectedPatientDetail || Object.keys(editingFields).length === 0) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update(editingFields)
        .eq('id', selectedPatientDetail.id);

      if (error) throw error;

      setEditingFields({});

      // 성공 메시지 (toast 사용하려면 부모 컴포넌트에서 전달받아야 함)
      console.log('정보가 저장되었습니다.');
    } catch (error) {
      console.error('Error updating patient fields:', error);
    }
  };
  
  const statusColors = {
    '입원': 'destructive',
    '퇴원': 'secondary',
    '재원': 'default',
    '낮병동': 'outline',
    '외래': 'default',
    '기타': 'secondary',
    '전화F/U': 'outline'
  } as const;

  const getStatusForDate = (patientId: string, date: string) => {
    return dailyStatuses.find(
      status => status.patient_id === patientId && status.status_date === date
    );
  };

  // 해당 날짜가 입원 기간 내인지 admission_cycles 및 daily_patient_status 데이터로 확인
  const getAdmissionStatusForDate = (patient: Patient, date: string) => {
    // 1. admission_cycles로 입원 기간 확인 (가장 정확함)
    if (patient.admission_cycles && patient.admission_cycles.length > 0) {
      for (const cycle of patient.admission_cycles) {
        const admissionDate = cycle.admission_date;
        const dischargeDate = cycle.discharge_date;
        
        // 입원 날짜부터 퇴원 날짜(또는 현재)까지의 기간에 해당 날짜가 포함되는지 확인
        if (date >= admissionDate) {
          if (!dischargeDate || date <= dischargeDate) {
            // 입원 중인 기간
            return {
              type: cycle.admission_type || '입원',
              isOngoing: !dischargeDate || date < dischargeDate
            };
          }
        }
      }
    }

    // 2. admission_cycles에 정보가 없으면 daily_patient_status로 추론
    const patientStatuses = dailyStatuses
      .filter(s => s.patient_id === patient.id)
      .sort((a, b) => a.status_date.localeCompare(b.status_date));

    if (patientStatuses.length === 0) return null;

    // 해당 날짜 이전의 가장 최근 입원/재원/퇴원 상태 찾기
    let lastAdmissionDate: string | null = null;
    let lastDischargeDate: string | null = null;
    let admissionType = '입원';

    for (const status of patientStatuses) {
      if (status.status_date > date) break;

      if (status.status_type === '입원' || status.status_type === '재원') {
        if (!lastAdmissionDate || status.status_date > lastAdmissionDate) {
          lastAdmissionDate = status.status_date;
          admissionType = status.status_type;
        }
        // 입원/재원이 나오면 이전 퇴원 기록 무효화
        if (lastDischargeDate && status.status_date > lastDischargeDate) {
          lastDischargeDate = null;
        }
      } else if (status.status_type === '퇴원') {
        lastDischargeDate = status.status_date;
      }
    }

    // 입원 기록이 있고, 퇴원하지 않았거나 입원이 퇴원보다 최근이면 입원 중
    if (lastAdmissionDate) {
      if (!lastDischargeDate || lastAdmissionDate > lastDischargeDate) {
        return {
          type: admissionType,
          isOngoing: true
        };
      }
    }

    return null;
  };

  // 배경색 결정
  const getBackgroundColor = (admissionStatus: { type: string; isOngoing: boolean } | null) => {
    if (!admissionStatus) return '';
    
    switch (admissionStatus.type) {
      case '입원':
      case '재원':
        return 'bg-red-100 dark:bg-red-950/30';
      case '낮병동':
        return 'bg-yellow-100 dark:bg-yellow-950/30';
      case '외래':
        return 'bg-green-100 dark:bg-green-950/30';
      default:
        return 'bg-blue-100 dark:bg-blue-950/30';
    }
  };

  const handleCellClick = (patientId: string, day: number, patient: Patient) => {
    const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
    const existingStatus = getStatusForDate(patientId, date);
    
    setSelectedCell({ patientId, date, patient });
    setSelectedStatus(existingStatus?.status_type || '');
    setNotes(existingStatus?.notes || '');
  };

  const handleSave = async () => {
    if (!selectedCell || !selectedStatus) return;

    // 현재 스크롤 위치 저장
    if (tableScrollRef.current) {
      const currentScroll = tableScrollRef.current.scrollLeft;
      setSavedScrollPosition(currentScroll);
      console.log('Saving scroll position:', currentScroll);
    }

    await onStatusUpdate(selectedCell.patientId, selectedCell.date, selectedStatus, notes);
    setSelectedCell(null);
    setSelectedStatus('');
    setNotes('');
  };

  const handleDelete = async () => {
    if (!selectedCell) return;

    // 현재 스크롤 위치 저장
    if (tableScrollRef.current) {
      const currentScroll = tableScrollRef.current.scrollLeft;
      setSavedScrollPosition(currentScroll);
      console.log('Saving scroll position:', currentScroll);
    }

    // 빈 상태로 업데이트하여 삭제 효과
    await onStatusUpdate(selectedCell.patientId, selectedCell.date, '', '');
    setSelectedCell(null);
    setSelectedStatus('');
    setNotes('');
  };

  const handleMemoDoubleClick = (patientId: string, memoType: 'memo1' | 'memo2', currentValue: string) => {
    setMemoCell({ patientId, memoType, currentValue });
    setMemoValue(currentValue);
  };

  const handleMemoSave = async () => {
    if (!memoCell) return;
    
    await onMemoUpdate(memoCell.patientId, memoCell.memoType, memoValue);
    setMemoCell(null);
    setMemoValue('');
  };

  const getDayOfWeek = (day: number) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return dayNames[date.getDay()];
  };

  // 환자 통계 계산
  const calculatePatientStats = async (patientId: string) => {
    try {
      // 해당 환자의 모든 상태 데이터 (날짜순 정렬)
      const patientStatuses = dailyStatuses
        .filter(s => s.patient_id === patientId)
        .sort((a, b) => a.status_date.localeCompare(b.status_date));
      
      // 당월 데이터 필터링
      const [year, month] = yearMonth.split('-');
      const monthStart = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      const currentMonthStatuses = patientStatuses.filter(
        s => s.status_date >= monthStart && s.status_date <= monthEnd
      );

      // 입원일수 계산 함수 (입원일부터 퇴원일까지의 기간, 월 범위 제한 가능)
      const calculateAdmissionDays = (statuses: typeof patientStatuses, limitStart?: string, limitEnd?: string) => {
        let totalDays = 0;
        let admissionDate: string | null = null;

        for (const status of statuses) {
          if (status.status_type === '입원' || status.status_type === '재원') {
            if (!admissionDate) {
              admissionDate = status.status_date;
            }
          } else if (status.status_type === '퇴원' && admissionDate) {
            // 입원일부터 퇴원일까지의 일수 계산 (퇴원일 포함)
            let startDate = admissionDate;
            let endDate = status.status_date;
            
            // 월 범위 제한이 있으면 적용
            if (limitStart && startDate < limitStart) {
              startDate = limitStart;
            }
            if (limitEnd && endDate > limitEnd) {
              endDate = limitEnd;
            }
            
            // 범위 내에 있을 때만 계산
            if (startDate <= endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              totalDays += days;
            }
            
            admissionDate = null;
          }
        }

        // 퇴원하지 않은 입원이 있으면 오늘까지 또는 월말까지 계산
        if (admissionDate) {
          let startDate = admissionDate;
          let endDate = new Date().toISOString().split('T')[0];
          
          // 월 범위 제한이 있으면 적용
          if (limitStart && startDate < limitStart) {
            startDate = limitStart;
          }
          if (limitEnd && endDate > limitEnd) {
            endDate = limitEnd;
          }
          
          // 범위 내에 있을 때만 계산
          if (startDate <= endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            totalDays += days;
          }
        }

        return totalDays;
      };

      // 당월 통계 계산 (해당 월 범위 내로 제한)
      const currentMonthStats = {
        admissionDays: calculateAdmissionDays(patientStatuses, monthStart, monthEnd),
        dayCare: currentMonthStatuses.filter(s => s.status_type === '낮병동').length,
        outpatient: currentMonthStatuses.filter(s => s.status_type === '외래').length,
        phoneFollowUp: currentMonthStatuses.filter(s => s.status_type === '전화F/U').length,
        revenue: 0
      };

      // 전체 통계 계산 (제한 없음)
      const totalStats = {
        admissionDays: calculateAdmissionDays(patientStatuses),
        dayCare: patientStatuses.filter(s => s.status_type === '낮병동').length,
        outpatient: patientStatuses.filter(s => s.status_type === '외래').length,
        phoneFollowUp: patientStatuses.filter(s => s.status_type === '전화F/U').length,
        revenue: 0
      };

      // 수납 완료 매출 계산
      const { data: treatmentPlans } = await supabase
        .from('treatment_plans')
        .select('treatment_amount, payment_date, is_paid')
        .eq('patient_id', patientId)
        .eq('is_paid', true);

      if (treatmentPlans) {
        // 당월 매출
        currentMonthStats.revenue = treatmentPlans
          .filter(tp => tp.payment_date && tp.payment_date >= monthStart && tp.payment_date <= monthEnd)
          .reduce((sum, tp) => sum + (tp.treatment_amount || 0), 0);

        // 전체 매출
        totalStats.revenue = treatmentPlans.reduce((sum, tp) => sum + (tp.treatment_amount || 0), 0);
      }

      setPatientStats({
        currentMonth: currentMonthStats,
        total: totalStats
      });
    } catch (error) {
      console.error('Error calculating patient stats:', error);
    }
  };

  const renderDayHeaders = () => {
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <th key={day} className="min-w-[60px] p-2 text-center text-xs font-medium border bg-muted">
          {day}({getDayOfWeek(day)})
        </th>
      );
    }
    return days;
  };

  // 스크롤 위치 복원 (useLayoutEffect로 DOM 업데이트 직후 실행)
  useLayoutEffect(() => {
    if (savedScrollPosition > 0 && tableScrollRef.current) {
      console.log('Immediate scroll restore to:', savedScrollPosition);
      tableScrollRef.current.scrollLeft = savedScrollPosition;
    }
  }, [dailyStatuses]);

  // 스크롤 위치 복원 (여러 번 시도하여 확실하게)
  useEffect(() => {
    if (tableScrollRef.current && savedScrollPosition > 0) {
      console.log('Restoring scroll position:', savedScrollPosition);
      
      // 즉시 실행
      tableScrollRef.current.scrollLeft = savedScrollPosition;
      
      // 여러 시점에서 재시도 (브라우저 렌더링 완료 후)
      const timeoutIds = [0, 10, 50, 100, 200, 300, 500].map(delay => 
        setTimeout(() => {
          if (tableScrollRef.current && tableScrollRef.current.scrollLeft !== savedScrollPosition) {
            tableScrollRef.current.scrollLeft = savedScrollPosition;
            console.log(`Scroll restored to: ${savedScrollPosition} (after ${delay}ms)`);
          }
        }, delay)
      );
      
      return () => {
        timeoutIds.forEach(id => clearTimeout(id));
      };
    }
  }, [dailyStatuses, savedScrollPosition]);

  // 마우스 드래그 스크롤 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tableScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableScrollRef.current.offsetLeft);
    setScrollLeft(tableScrollRef.current.scrollLeft);
    tableScrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    if (!tableScrollRef.current) return;
    setIsDragging(false);
    tableScrollRef.current.style.cursor = 'grab';
  };

  const handleMouseUp = () => {
    if (!tableScrollRef.current) return;
    setIsDragging(false);
    tableScrollRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도 조절
    tableScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const renderPatientRow = (patient: Patient) => {
    const cells = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
      const status = getStatusForDate(patient.id, date);
      const admissionStatus = getAdmissionStatusForDate(patient, date);
      
      // 해당 날짜에 입원/재원 상태가 직접 입력된 경우 체크
      const hasDirectAdmissionStatus = status && ['입원', '재원'].includes(status.status_type);
      
      // 배경색 결정: 낮병동/외래는 직접 입력된 경우 배경색 적용
      let bgColor = '';
      if (status && status.status_type === '낮병동') {
        bgColor = 'bg-yellow-100 dark:bg-yellow-950/30';
      } else if (status && status.status_type === '외래') {
        bgColor = 'bg-green-100 dark:bg-green-950/30';
      } else {
        bgColor = (!hasDirectAdmissionStatus && admissionStatus) ? getBackgroundColor(admissionStatus) : '';
      }
      
      // 입원 기간 내 재원/입원 상태는 배경색으로만 표시 (중복 방지)
      const shouldShowStatus = status && !(
        admissionStatus && 
        !hasDirectAdmissionStatus &&
        (status.status_type === '재원' || status.status_type === '입원')
      );
      
      cells.push(
        <td key={day} className={`p-0.5 border ${bgColor}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-full p-0.5 text-xs bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => handleCellClick(patient.id, day, patient)}
          >
            {shouldShowStatus && (
              <div className="flex flex-col items-center gap-0.5">
                {status.status_type === '관리 중' ? (
                  <span className="text-xs font-medium">돌환</span>
                ) : (
                  <>
                    <Badge
                      variant={statusColors[status.status_type as keyof typeof statusColors] || 'default'}
                      className="text-[10px] px-1 py-0"
                    >
                      {status.status_type}
                    </Badge>
                    {status.notes && (
                      <span className="text-[9px] text-muted-foreground truncate max-w-full">
                        {status.notes.substring(0, 10)}...
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </Button>
        </td>
      );
    }
    
    return cells;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium">상태 범례:</span>
        <div className="flex items-center gap-1">
          <div className="w-8 h-6 bg-red-100 dark:bg-red-950/30 border rounded"></div>
          <span className="text-xs">입원/재원</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-6 bg-yellow-100 dark:bg-yellow-950/30 border rounded"></div>
          <span className="text-xs">낮병동</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-6 bg-green-100 dark:bg-green-950/30 border rounded"></div>
          <span className="text-xs">외래</span>
        </div>
        {statusTypes.map(statusType => (
          <Badge
            key={statusType}
            variant={statusColors[statusType as keyof typeof statusColors] || 'default'}
            className="text-xs"
          >
            {statusType}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onPreviousMonth}
          aria-label="이전 월"
          className="flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div 
          ref={tableScrollRef} 
          className="overflow-x-auto select-none scrollbar-hide flex-1"
          style={{ cursor: 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <table className="min-w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="min-w-[100px] p-2 text-left font-medium border sticky left-0 bg-muted z-10">
                환자명
              </th>
              <th className="min-w-[120px] p-2 text-left font-medium border">
                메모
              </th>
              <th className="min-w-[100px] p-2 text-left font-medium border">
                주치의
              </th>
              <th className="min-w-[100px] p-2 text-left font-medium border">
                이전병원
              </th>
              {renderDayHeaders()}
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => {
              return (
                <tr key={patient.id} className="hover:bg-muted/50">
                  <td className="p-2 border sticky left-0 bg-background">
                    <div className="space-y-0.5">
                      <div 
                        className="font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => {
                          setSelectedPatientDetail(patient);
                          setEditingManagementStatus(patient.management_status || '관리 중');
                          calculatePatientStats(patient.id);
                        }}
                      >
                        {patient.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        담당: {patient.manager_name || '-'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        진단: {patient.diagnosis || '-'}
                      </div>
                      <div className="text-[10px]">
                        <Badge variant={
                          patient.management_status === '아웃' ? 'destructive' :
                          patient.management_status === '아웃위기' ? 'default' :
                          'secondary'
                        } className="text-[9px] px-1 py-0">
                          {patient.management_status || '관리 중'}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td 
                    className="p-2 border text-xs cursor-pointer hover:bg-muted/50"
                    onDoubleClick={() => handleMemoDoubleClick(patient.id, 'memo1', patient.memo1 || '')}
                  >
                    {patient.memo1 || '-'}
                  </td>
                  <td className="p-2 border text-xs">
                    {[patient.korean_doctor, patient.western_doctor].filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="p-2 border text-xs">
                    {patient.previous_hospital || '-'}
                  </td>
                  {renderPatientRow(patient)}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        <Button 
          variant="outline" 
          size="icon"
          onClick={onNextMonth}
          aria-label="다음 월"
          className="flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 상태 편집 다이얼로그 */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCell?.patient.name} - {selectedCell?.date} 상태
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">상태 선택</Label>
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  // 상태 변경 시 메모 초기화 (기타/전화F/U가 아닌 경우)
                  if (value !== '기타' && value !== '전화F/U') {
                    setNotes('');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  {statusTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(selectedStatus === '기타' || selectedStatus === '전화F/U') && (
              <div>
                <Label htmlFor="notes">메모 {selectedStatus === '기타' ? '(기타)' : '(전화F/U)'}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  rows={3}
                />
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="destructive" onClick={handleDelete}>
                삭제
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedCell(null)}>
                  취소
                </Button>
                <Button onClick={handleSave} disabled={!selectedStatus}>
                  저장
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 메모 편집 다이얼로그 */}
      <Dialog open={!!memoCell} onOpenChange={() => setMemoCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              메모 편집
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="memo">메모 내용</Label>
              <Textarea
                id="memo"
                value={memoValue}
                onChange={(e) => setMemoValue(e.target.value)}
                placeholder="메모를 입력하세요..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMemoCell(null)}>
                취소
              </Button>
              <Button onClick={handleMemoSave}>
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 환자 상세정보 다이얼로그 */}
      <Dialog open={!!selectedPatientDetail} onOpenChange={() => {
        setSelectedPatientDetail(null);
        setEditingFields({});
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPatientDetail?.name} - 환자 상세정보
            </DialogTitle>
          </DialogHeader>
          
          {selectedPatientDetail && (
            <div className="space-y-6 mt-4">
              {/* API 자동입력 정보 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="text-lg font-semibold">API 자동입력 정보</h3>
                  <Badge variant="outline">자동</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* 고객명 */}
                  <div>
                    <Label>고객명 *</Label>
                    <Input
                      value={selectedPatientDetail?.name || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 고객번호 */}
                  <div>
                    <Label>고객번호</Label>
                    <Input
                      value={selectedPatientDetail?.customer_number || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 주민번호 */}
                  <div>
                    <Label>주민번호</Label>
                    <Input
                      value={selectedPatientDetail?.resident_number_masked || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 휴대폰번호 */}
                  <div>
                    <Label>휴대폰번호</Label>
                    <Input
                      value={selectedPatientDetail?.phone || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 성별 */}
                  <div>
                    <Label>성별</Label>
                    <Input
                      value={selectedPatientDetail?.gender || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 나이(만) */}
                  <div>
                    <Label>나이(만)</Label>
                    <Input
                      value={selectedPatientDetail?.age?.toString() || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 내원동기 */}
                  <div>
                    <Label>내원동기</Label>
                    <Input
                      value={selectedPatientDetail?.visit_motivation || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 진단명 대분류 */}
                  <div>
                    <Label>진단명 (대분류)</Label>
                    <Input
                      value={selectedPatientDetail?.diagnosis_category || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 진단명 중분류 */}
                  <div>
                    <Label>진단명 (중분류)</Label>
                    <Input
                      value={selectedPatientDetail?.diagnosis_detail || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 이전병원 대분류 */}
                  <div>
                    <Label>이전병원 (대분류)</Label>
                    <Input
                      value={selectedPatientDetail?.hospital_category || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 이전병원 중분류 */}
                  <div>
                    <Label>이전병원 (중분류)</Label>
                    <Input
                      value={selectedPatientDetail?.hospital_branch || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 주소 */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label>주소</Label>
                    <Input
                      value={selectedPatientDetail?.address || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* CRM메모 */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label>CRM메모</Label>
                    <Textarea
                      value={selectedPatientDetail?.crm_memo || ''}
                      disabled
                      className="bg-muted"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* 추가 입력 정보 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="text-lg font-semibold">추가 입력 정보</h3>
                  <Badge variant="outline">수동입력</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* 환자 or 보호자 */}
                  <div>
                    <Label>환자 or 보호자</Label>
                    <Select
                      value={selectedPatientDetail?.patient_or_guardian || '환자'}
                      onValueChange={(value) => {
                        updateEditingField('patient_or_guardian', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        <SelectItem value="환자">환자</SelectItem>
                        <SelectItem value="보호자">보호자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 식이 */}
                  <div>
                    <Label>식이</Label>
                    <Input
                      value={selectedPatientDetail?.diet_info || ''}
                      onChange={(e) => updateEditingField('diet_info', e.target.value)}
                      placeholder="식이정보"
                    />
                  </div>

                  {/* 유입상태 */}
                  <div>
                    <Label>유입상태 *</Label>
                    <Select
                      value={selectedPatientDetail?.inflow_status || '유입'}
                      onValueChange={(value) => {
                        updateEditingField('inflow_status', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        <SelectItem value="유입">유입</SelectItem>
                        <SelectItem value="실패">실패</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 내원형태 */}
                  <div>
                    <Label>내원형태</Label>
                    <Select
                      value={selectedPatientDetail?.visit_type || ''}
                      onValueChange={(value) => {
                        updateEditingField('visit_type', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        <SelectItem value="입원">입원</SelectItem>
                        <SelectItem value="외래">외래</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 보호자 이름 */}
                  <div>
                    <Label>보호자 이름</Label>
                    <Input
                      value={selectedPatientDetail?.guardian_name || ''}
                      onChange={(e) => updateEditingField('guardian_name', e.target.value)}
                      placeholder="보호자 이름"
                    />
                  </div>

                  {/* 보호자 관계 */}
                  <div>
                    <Label>보호자 관계</Label>
                    <Input
                      value={selectedPatientDetail?.guardian_relationship || ''}
                      onChange={(e) => updateEditingField('guardian_relationship', e.target.value)}
                      placeholder="보호자 관계"
                    />
                  </div>

                  {/* 보호자 연락처 */}
                  <div>
                    <Label>보호자 연락처</Label>
                    <Input
                      value={selectedPatientDetail?.guardian_phone || ''}
                      onChange={(e) => updateEditingField('guardian_phone', e.target.value)}
                      placeholder="보호자 연락처"
                    />
                  </div>

                  {/* 담당자(상담실장) */}
                  <div>
                    <Label>담당자(상담실장)</Label>
                    <Input
                      value={selectedPatientDetail?.manager_name || currentUserName}
                      disabled
                      className="bg-muted"
                      placeholder="자동입력"
                    />
                  </div>

                  {/* 한방주치의 */}
                  <div>
                    <Label>한방주치의</Label>
                    <Input
                      value={selectedPatientDetail?.korean_doctor || ''}
                      onChange={(e) => updateEditingField('korean_doctor', e.target.value)}
                      placeholder="한방주치의"
                    />
                  </div>

                  {/* 양방주치의 */}
                  <div>
                    <Label>양방주치의</Label>
                    <Input
                      value={selectedPatientDetail?.western_doctor || ''}
                      onChange={(e) => updateEditingField('western_doctor', e.target.value)}
                      placeholder="양방주치의"
                    />
                  </div>
                </div>
              </div>

              {/* 상세 정보 입력 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="text-lg font-semibold">상세 정보 입력</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insurance-type">실비보험유형</Label>
                    <Select 
                      value={selectedPatientDetail?.insurance_type || ''} 
                      onValueChange={(value) => {
                        updateEditingField('insurance_type', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="실비보험유형을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        {insuranceTypeOptions.map((option: any) => (
                          <SelectItem key={option.id} value={option.name}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>관리 상태</Label>
                    <Select 
                      value={selectedPatientDetail?.management_status || '관리 중'} 
                      onValueChange={(value) => {
                        updateEditingField('management_status', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="관리 상태를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        {patientStatusOptions.map((option: any) => (
                          <SelectItem key={option.id} value={option.name}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>월평균 입원일수</Label>
                    <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                      <span className="text-sm">
                        {selectedPatientDetail?.monthly_avg_inpatient_days 
                          ? `${selectedPatientDetail.monthly_avg_inpatient_days}일` 
                          : '-'
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      일별 환자 관리 현황에서 자동 계산
                    </p>
                  </div>

                  <div>
                    <Label>월평균 외래일수</Label>
                    <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                      <span className="text-sm">
                        {selectedPatientDetail?.monthly_avg_outpatient_days 
                          ? `${selectedPatientDetail.monthly_avg_outpatient_days}일` 
                          : '-'
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      일별 환자 관리 현황에서 자동 계산
                    </p>
                  </div>

                  <div>
                    <Label>수납금액</Label>
                    <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                      <span className="text-sm font-semibold text-primary">
                        {selectedPatientDetail?.payment_amount ? 
                          `${selectedPatientDetail.payment_amount.toLocaleString()}원` : '-'
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      치료 계획 관리에서 자동 계산
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="hospital-treatment">본병원 치료</Label>
                    <Textarea
                      id="hospital-treatment"
                      placeholder="본병원 치료 내용을 입력하세요"
                      value={selectedPatientDetail?.hospital_treatment || ''}
                      onChange={(e) => updateEditingField('hospital_treatment', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="examination-schedule">본병원 검사일정</Label>
                    <Textarea
                      id="examination-schedule"
                      placeholder="본병원 검사일정을 입력하세요"
                      value={selectedPatientDetail?.examination_schedule || ''}
                      onChange={(e) => updateEditingField('examination_schedule', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* 일정 정보 */}
                  <div>
                    <Label>유입일</Label>
                    <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                      <span className="text-sm">
                        {selectedPatientDetail?.created_at ? 
                          new Date(selectedPatientDetail.created_at).toLocaleDateString('ko-KR') : '-'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>마지막내원일</Label>
                    <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                      <span className="text-sm">
                        {selectedPatientDetail?.last_visit_date ? 
                          new Date(selectedPatientDetail.last_visit_date).toLocaleDateString('ko-KR') : '-'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    onClick={saveAllEditingFields}
                    disabled={Object.keys(editingFields).length === 0}
                  >
                    수정 저장
                  </Button>
                </div>
              </div>

              {/* 활동 통계 정보 */}
              {patientStats && (
                <div className="space-y-3">
                  <h3 className="font-semibold">활동 통계</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 당월 통계 */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">당월</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">입원일수</span>
                          <span className="font-medium">{patientStats.currentMonth.admissionDays}일</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">낮병동</span>
                          <span className="font-medium">{patientStats.currentMonth.dayCare}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">외래</span>
                          <span className="font-medium">{patientStats.currentMonth.outpatient}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">전화F/U</span>
                          <span className="font-medium">{patientStats.currentMonth.phoneFollowUp}회</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">매출</span>
                          <span className="font-semibold text-primary">
                            {patientStats.currentMonth.revenue.toLocaleString()}원
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 총 통계 */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">총 누적</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">입원일수</span>
                          <span className="font-medium">{patientStats.total.admissionDays}일</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">낮병동</span>
                          <span className="font-medium">{patientStats.total.dayCare}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">외래</span>
                          <span className="font-medium">{patientStats.total.outpatient}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">전화F/U</span>
                          <span className="font-medium">{patientStats.total.phoneFollowUp}회</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">매출</span>
                          <span className="font-semibold text-primary">
                            {patientStats.total.revenue.toLocaleString()}원
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* 닫기 버튼 */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setSelectedPatientDetail(null);
                  setEditingFields({});
                }}>
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}