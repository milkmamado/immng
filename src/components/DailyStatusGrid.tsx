import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
}

export function DailyStatusGrid({
  patients,
  dailyStatuses,
  yearMonth,
  daysInMonth,
  onStatusUpdate,
}: DailyStatusGridProps) {
  const [selectedCell, setSelectedCell] = useState<{
    patientId: string;
    date: string;
    patient: Patient;
  } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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

  const handleCellClick = (patientId: string, day: number, patient: Patient) => {
    const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
    const existingStatus = getStatusForDate(patientId, date);
    
    setSelectedCell({ patientId, date, patient });
    setSelectedStatus(existingStatus?.status_type || '');
    setNotes(existingStatus?.notes || '');
  };

  const handleSave = async () => {
    if (!selectedCell || !selectedStatus) return;

    await onStatusUpdate(selectedCell.patientId, selectedCell.date, selectedStatus, notes);
    setSelectedCell(null);
    setSelectedStatus('');
    setNotes('');
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

  const renderPatientRow = (patient: Patient) => {
    const cells = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
      const status = getStatusForDate(patient.id, date);
      
      cells.push(
        <td key={day} className="p-0.5 border">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-full p-0.5 text-xs"
            onClick={() => handleCellClick(patient.id, day, patient)}
          >
            {status && (
              <div className="flex flex-col items-center gap-0.5">
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

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="min-w-[100px] p-2 text-left font-medium border sticky left-0 bg-muted z-10">
                환자명
              </th>
              <th className="min-w-[80px] p-2 text-left font-medium border">
                담당실장
              </th>
              <th className="min-w-[120px] p-2 text-left font-medium border">
                메모1
              </th>
              <th className="min-w-[120px] p-2 text-left font-medium border">
                메모2
              </th>
              <th className="min-w-[120px] p-2 text-left font-medium border">
                진단명
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
                  <td className="p-2 border font-medium sticky left-0 bg-background">
                    {patient.name}
                  </td>
                  <td className="p-2 border text-xs">
                    {patient.manager_name || '-'}
                  </td>
                  <td className="p-2 border text-xs">
                    -
                  </td>
                  <td className="p-2 border text-xs">
                    -
                  </td>
                  <td className="p-2 border text-xs">
                    {patient.diagnosis || '-'}
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
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
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedCell(null)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={!selectedStatus}>
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}