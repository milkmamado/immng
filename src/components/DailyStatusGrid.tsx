import { useState, useRef, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  management_status?: string;
  admission_cycles?: AdmissionCycle[];
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
}

export function DailyStatusGrid({
  patients,
  dailyStatuses,
  yearMonth,
  daysInMonth,
  onStatusUpdate,
  onMemoUpdate,
  onManagementStatusUpdate,
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
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);
  const [editingManagementStatus, setEditingManagementStatus] = useState<string>('');
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);
  
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const statusTypes = ['입원', '퇴원', '재원', '낮병동', '외래', '기타', '전화F/U'];
  
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

  // 해당 날짜가 입원 기간 내인지 daily_patient_status 데이터로 추론
  const getAdmissionStatusForDate = (patient: Patient, date: string) => {
    // 해당 환자의 모든 상태를 날짜순 정렬
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
      // 낮병동은 연속 상태가 아니므로 제외
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

  // 스크롤 위치 복원 (여러 번 시도)
  useEffect(() => {
    if (tableScrollRef.current && savedScrollPosition > 0) {
      console.log('Restoring scroll position:', savedScrollPosition);
      
      // 여러 번 시도하여 확실하게 복원
      const attempts = [0, 50, 100, 200];
      const timeoutIds = attempts.map(delay => 
        setTimeout(() => {
          if (tableScrollRef.current) {
            tableScrollRef.current.scrollLeft = savedScrollPosition;
            console.log(`Scroll restored to: ${tableScrollRef.current.scrollLeft} (after ${delay}ms)`);
          }
        }, delay)
      );
      
      return () => timeoutIds.forEach(id => clearTimeout(id));
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

      <div 
        ref={tableScrollRef} 
        className="overflow-x-auto select-none scrollbar-hide"
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
      <Dialog open={!!selectedPatientDetail} onOpenChange={() => setSelectedPatientDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">환자 상세 정보</DialogTitle>
          </DialogHeader>
          
          {selectedPatientDetail && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">환자명</Label>
                  <p className="font-medium">{selectedPatientDetail.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">환자번호</Label>
                  <p className="font-medium">{selectedPatientDetail.patient_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">담당자</Label>
                  <p className="font-medium">{selectedPatientDetail.manager_name || '-'}</p>
                </div>
              </div>

              {/* 관리 상태 */}
              <div>
                <Label htmlFor="management_status">관리 상태</Label>
                <Select 
                  value={editingManagementStatus} 
                  onValueChange={setEditingManagementStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value="관리 중">관리 중</SelectItem>
                    <SelectItem value="아웃위기">아웃위기</SelectItem>
                    <SelectItem value="아웃">아웃</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  * 2주 이상 활동 없으면 자동으로 "아웃위기", 3주 이상이면 "아웃"으로 변경됩니다.
                </p>
              </div>

              {/* 진료 정보 */}
              <div className="space-y-3">
                <h3 className="font-semibold">진료 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">진단명</Label>
                    <p className="font-medium">{selectedPatientDetail.diagnosis || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">상세 진단</Label>
                    <p className="font-medium">{selectedPatientDetail.detailed_diagnosis || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">한방 주치의</Label>
                    <p className="font-medium">{selectedPatientDetail.korean_doctor || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">양방 주치의</Label>
                    <p className="font-medium">{selectedPatientDetail.western_doctor || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">이전 병원</Label>
                    <p className="font-medium">{selectedPatientDetail.previous_hospital || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedPatientDetail(null)}>
                  닫기
                </Button>
                <Button 
                  onClick={async () => {
                    if (selectedPatientDetail && editingManagementStatus !== selectedPatientDetail.management_status) {
                      await onManagementStatusUpdate(selectedPatientDetail.id, editingManagementStatus);
                      setSelectedPatientDetail(null);
                    } else {
                      setSelectedPatientDetail(null);
                    }
                  }}
                >
                  저장
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}