import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar as CalendarIcon, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { calculateDaysSinceLastCheck } from "@/utils/patientStatusUtils";
import { format } from 'date-fns';
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
  risk_level?: string;
  days_since_last_check?: number;
}

interface ReconnectTracking {
  id: string;
  patient_id: string;
  is_reconnected: boolean;
  reconnected_at: string | null;
  reconnect_notes?: string;
}

export default function ExemptPatientManagement() {
  const { applyBranchFilter, currentBranch } = useBranchFilter();
  const [exemptPatients, setExemptPatients] = useState<Patient[]>([]);
  const [reconnectTracking, setReconnectTracking] = useState<ReconnectTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [localNotes, setLocalNotes] = useState<{ [key: string]: string }>({});
  const [managers, setManagers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>('all');
  const { toast } = useToast();

  // 필터 상태
  const [inflowDateRange, setInflowDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>('all');
  const [diagnosisSearch, setDiagnosisSearch] = useState('');

  useEffect(() => {
    fetchData();
    fetchManagers();

    const channel = supabase
      .channel('exempt-patient-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients'
        },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_reconnect_tracking'
        },
        () => {
          fetchReconnectTracking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBranch]);

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setManagers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
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
          payment_amount,
          inflow_date, consultation_date, memo1,
          special_note_1, special_note_2,
          treatment_memo_1, treatment_memo_2, crm_memo,
          hospital_category, hospital_branch,
          resident_number_masked,
          admission_cycles (
            id, admission_date, discharge_date, admission_type, status
          )
        `)
        .eq('management_status', '면책기간')
        .order('created_at', { ascending: false });

      query = applyBranchFilter(query);

      const { data, error } = await query;

      if (error) throw error;

      const patientsWithRisk = (data || []).map(patient => {
        const daysSinceCheck = calculateDaysSinceLastCheck(
          patient.last_visit_date,
          patient.inflow_date,
          patient.consultation_date
        );

        return {
          ...patient,
          days_since_last_check: daysSinceCheck,
          risk_level: '면책기간'
        };
      });

      setExemptPatients(patientsWithRisk);
      await fetchReconnectTracking();
    } catch (error: any) {
      console.error('Failed to fetch exempt patients:', error);
      toast({
        title: "데이터 로딩 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReconnectTracking = async () => {
    try {
      let query = supabase
        .from('patient_reconnect_tracking')
        .select('*');

      query = applyBranchFilter(query);

      const { data, error } = await query;

      if (error) throw error;
      setReconnectTracking(data || []);
    } catch (error: any) {
      console.error('Failed to fetch reconnect tracking:', error);
    }
  };

  const handleReconnectToggle = async (patientId: string, currentStatus: boolean) => {
    try {
      const trackingRecord = reconnectTracking.find(t => t.patient_id === patientId);

      if (trackingRecord) {
        const { error } = await supabase
          .from('patient_reconnect_tracking')
          .update({
            is_reconnected: !currentStatus,
            reconnected_at: !currentStatus ? new Date().toISOString() : null,
          })
          .eq('id', trackingRecord.id);

        if (error) throw error;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('patient_reconnect_tracking')
          .insert({
            patient_id: patientId,
            is_reconnected: true,
            reconnected_at: new Date().toISOString(),
            created_by: userData.user.id,
            branch: currentBranch,
          });

        if (error) throw error;
      }

      await fetchReconnectTracking();
      toast({
        title: "재연결 상태 업데이트",
        description: "재연결 상태가 업데이트되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNotesChange = (patientId: string, value: string) => {
    setLocalNotes(prev => ({ ...prev, [patientId]: value }));
  };

  const handleNotesSave = async (patientId: string) => {
    try {
      const trackingRecord = reconnectTracking.find(t => t.patient_id === patientId);
      const notes = localNotes[patientId] || '';

      if (trackingRecord) {
        const { error } = await supabase
          .from('patient_reconnect_tracking')
          .update({ reconnect_notes: notes })
          .eq('id', trackingRecord.id);

        if (error) throw error;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('patient_reconnect_tracking')
          .insert({
            patient_id: patientId,
            reconnect_notes: notes,
            is_reconnected: false,
            created_by: userData.user.id,
            branch: currentBranch,
          });

        if (error) throw error;
      }

      await fetchReconnectTracking();
      toast({
        title: "메모 저장 완료",
        description: "재연결 메모가 저장되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "저장 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReturnToManagement = async (patientId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { error: updateError } = await supabase
        .from('patients')
        .update({ management_status: '관리 중' })
        .eq('id', patientId);

      if (updateError) throw updateError;

      const today = new Date().toISOString().split('T')[0];
      const { error: statusError } = await supabase
        .from('daily_patient_status')
        .insert({
          patient_id: patientId,
          status_date: today,
          status_type: '돌환',
          created_by: userData.user.id,
          branch: currentBranch,
        });

      if (statusError) throw statusError;

      await fetchData();
      toast({
        title: "관리 중으로 복귀",
        description: "환자가 관리 중 상태로 변경되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "복귀 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
        면책기간
      </Badge>
    );
  };

  const handleExportToExcel = () => {
    const exportData = filteredExemptPatients.map(patient => {
      const tracking = reconnectTracking.find(t => t.patient_id === patient.id);
      return {
        '고객번호': patient.customer_number || '',
        '이름': patient.name,
        '진단카테고리': patient.diagnosis_category || '',
        '진단상세': patient.diagnosis_detail || '',
        '한의사': patient.korean_doctor || '',
        '양의사': patient.western_doctor || '',
        '담당자': patient.manager_name || '',
        '경과일수': patient.days_since_last_check || 0,
        '내원타입': patient.visit_type || '',
        '유입일': patient.inflow_date || '',
        '재연결여부': tracking?.is_reconnected ? 'O' : 'X',
        '재연결메모': tracking?.reconnect_notes || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '면책환자관리');
    XLSX.writeFile(wb, `면책환자관리_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredExemptPatients = exemptPatients.filter(patient => {
    if (selectedManager !== 'all') {
      const manager = managers.find(m => m.id === selectedManager);
      if (manager && patient.manager_name !== manager.name) {
        return false;
      }
    }

    if (inflowDateRange.from || inflowDateRange.to) {
      const inflowDate = patient.inflow_date ? new Date(patient.inflow_date) : null;
      if (inflowDate) {
        if (inflowDateRange.from && inflowDate < inflowDateRange.from) return false;
        if (inflowDateRange.to && inflowDate > inflowDateRange.to) return false;
      } else {
        return false;
      }
    }

    if (visitTypeFilter !== 'all' && patient.visit_type !== visitTypeFilter) {
      return false;
    }

    if (diagnosisSearch.trim()) {
      const search = diagnosisSearch.toLowerCase();
      const categoryMatch = patient.diagnosis_category?.toLowerCase().includes(search);
      const detailMatch = patient.diagnosis_detail?.toLowerCase().includes(search);
      if (!categoryMatch && !detailMatch) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">면책환자 관리</h1>
          <p className="text-muted-foreground mt-1">
            면책기간 상태의 환자를 관리합니다
          </p>
        </div>
        <Button onClick={handleExportToExcel} variant="outline">
          <FileDown className="w-4 h-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>담당자별 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedManager} onValueChange={setSelectedManager}>
            <SelectTrigger>
              <SelectValue placeholder="담당자 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 담당자</SelectItem>
              {managers.map(manager => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-muted-foreground">총 면책환자</div>
              <div className="text-2xl font-bold text-blue-700">
                {filteredExemptPatients.length}명
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>유입일 범위</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {inflowDateRange.from ? format(inflowDateRange.from, 'yyyy-MM-dd') : '시작일'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background">
                    <Calendar
                      mode="single"
                      selected={inflowDateRange.from}
                      onSelect={(date) => setInflowDateRange(prev => ({ ...prev, from: date }))}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {inflowDateRange.to ? format(inflowDateRange.to, 'yyyy-MM-dd') : '종료일'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background">
                    <Calendar
                      mode="single"
                      selected={inflowDateRange.to}
                      onSelect={(date) => setInflowDateRange(prev => ({ ...prev, to: date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>내원타입</Label>
              <Select value={visitTypeFilter} onValueChange={setVisitTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="입원">입원</SelectItem>
                  <SelectItem value="외래">외래</SelectItem>
                  <SelectItem value="재원">재원</SelectItem>
                  <SelectItem value="낮병동">낮병동</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>진단 검색</Label>
              <Input
                placeholder="진단 카테고리 또는 상세..."
                value={diagnosisSearch}
                onChange={(e) => setDiagnosisSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filteredExemptPatients.map(patient => {
          const tracking = reconnectTracking.find(t => t.patient_id === patient.id);
          const currentNotes = localNotes[patient.id] ?? (tracking?.reconnect_notes || '');

          return (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{patient.name}</CardTitle>
                      {getRiskBadge(patient.risk_level || '면책기간')}
                      <Badge variant="secondary">
                        경과 {patient.days_since_last_check}일
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>고객번호: {patient.customer_number || '-'}</div>
                      <div>담당자: {patient.manager_name || '-'}</div>
                      <div>진단: {patient.diagnosis_category || '-'} / {patient.diagnosis_detail || '-'}</div>
                      <div>내원타입: {patient.visit_type || '-'}</div>
                      {patient.inflow_date && <div>유입일: {patient.inflow_date}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsDetailOpen(true);
                      }}
                    >
                      상세보기
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleReturnToManagement(patient.id)}
                    >
                      관리중으로 복귀
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`reconnect-${patient.id}`}
                    checked={tracking?.is_reconnected || false}
                    onCheckedChange={() =>
                      handleReconnectToggle(patient.id, tracking?.is_reconnected || false)
                    }
                  />
                  <Label htmlFor={`reconnect-${patient.id}`} className="cursor-pointer">
                    재연결 시도 완료
                  </Label>
                  {tracking?.reconnected_at && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({new Date(tracking.reconnected_at).toLocaleDateString()})
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`notes-${patient.id}`}>재연결 메모</Label>
                  <Textarea
                    id={`notes-${patient.id}`}
                    placeholder="재연결 시도 내용을 기록하세요..."
                    value={currentNotes}
                    onChange={(e) => handleNotesChange(patient.id, e.target.value)}
                    rows={2}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleNotesSave(patient.id)}
                  >
                    메모 저장
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredExemptPatients.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>면책기간 상태의 환자가 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>환자 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">이름</Label>
                  <p className="font-medium">{selectedPatient.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">고객번호</Label>
                  <p className="font-medium">{selectedPatient.customer_number || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">진단 카테고리</Label>
                  <p className="font-medium">{selectedPatient.diagnosis_category || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">진단 상세</Label>
                  <p className="font-medium">{selectedPatient.diagnosis_detail || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">담당자</Label>
                  <p className="font-medium">{selectedPatient.manager_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">내원타입</Label>
                  <p className="font-medium">{selectedPatient.visit_type || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">유입일</Label>
                  <p className="font-medium">{selectedPatient.inflow_date || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">마지막 내원일</Label>
                  <p className="font-medium">{selectedPatient.last_visit_date || '-'}</p>
                </div>
              </div>
              {selectedPatient.crm_memo && (
                <div>
                  <Label className="text-muted-foreground">CRM 메모</Label>
                  <p className="whitespace-pre-wrap">{selectedPatient.crm_memo}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">담당자 메모</Label>
                <p className="whitespace-pre-wrap">{selectedPatient.memo1 || '-'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
