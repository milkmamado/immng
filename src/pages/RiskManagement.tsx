import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, AlertTriangle, Phone, Calendar, Filter as FilterIcon } from "lucide-react";
import { format } from "date-fns";
import { calculateDaysSinceLastCheck, calculateAutoManagementStatus, shouldAutoUpdateStatus } from "@/utils/patientStatusUtils";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  customer_number?: string;
  name: string;
  phone?: string;
  age?: number;
  gender?: string;
  diagnosis_detail?: string;
  diagnosis_category?: string;
  manager_name?: string;
  inflow_status?: string;
  created_at: string;
  last_status_date?: string;
  days_since_last_check: number;
  risk_level: "아웃" | "아웃위기";
  visit_type?: string;
  counselor?: string;
  korean_doctor?: string;
  western_doctor?: string;
  hospital_category?: string;
  hospital_branch?: string;
  diet_info?: string;
  visit_motivation?: string;
  crm_memo?: string;
  management_status?: string;
}

interface ReconnectTracking {
  id?: string;
  patient_id: string;
  is_reconnected: boolean;
  reconnect_notes?: string;
  reconnected_at?: string;
}

export default function RiskManagement() {
  const [riskPatients, setRiskPatients] = useState<Patient[]>([]);
  const [reconnectData, setReconnectData] = useState<Map<string, ReconnectTracking>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);
  const [selectedManager, setSelectedManager] = useState<string>('all');
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  
  // 필터 상태
  const [inflowDateStart, setInflowDateStart] = useState<Date | undefined>();
  const [inflowDateEnd, setInflowDateEnd] = useState<Date | undefined>();
  const [selectedVisitTypes, setSelectedVisitTypes] = useState<string[]>([]);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchManagerList();
      fetchRiskPatients();
    }
    
    const channel = supabase
      .channel('risk-management-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients'
        },
        () => {
          if (user) {
            fetchRiskPatients();
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
          if (user) {
            fetchRiskPatients();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  useEffect(() => {
    if (user) {
      fetchRiskPatients();
    }
  }, [selectedManager]);

  const fetchManagerList = async () => {
    const isMasterOrAdmin = userRole === 'master' || userRole === 'admin';
    
    if (isMasterOrAdmin) {
      // approved_users view를 사용하여 매니저 목록 조회 (일관성 개선)
      const { data: managersData } = await supabase
        .from('approved_users')
        .select('user_id, name')
        .eq('role', 'manager')
        .eq('approval_status', 'approved')
        .order('name');

      if (managersData) {
        setManagers(managersData.map(m => ({ id: m.user_id!, name: m.name || '이름 없음' })));
      }
    }
  };

  const fetchRiskPatients = async () => {
    try {
      setLoading(true);

      const isMasterOrAdmin = userRole === 'master' || userRole === 'admin';
      
      let patientsQuery = supabase
        .from("patients")
        .select("*")
        .eq("inflow_status", "유입");

      // 일반 매니저는 본인 환자만, 마스터/관리자가 특정 매니저 선택 시 해당 매니저만
      if (!isMasterOrAdmin || (selectedManager !== 'all' && selectedManager)) {
        const targetManager = isMasterOrAdmin ? selectedManager : user?.id;
        patientsQuery = patientsQuery.eq("assigned_manager", targetManager);
      }

      const { data: patientsData, error: patientsError } = await patientsQuery;
      if (patientsError) throw patientsError;

      const { data: statusData, error: statusError } = await supabase
        .from("daily_patient_status")
        .select("patient_id, status_date")
        .order("status_date", { ascending: false });

      if (statusError) throw statusError;

      const lastCheckMap = new Map<string, string>();
      statusData?.forEach(status => {
        if (!lastCheckMap.has(status.patient_id)) {
          lastCheckMap.set(status.patient_id, status.status_date);
        }
      });

      const riskyPatients: Patient[] = [];
      const manuallySetStatuses = ['아웃', '아웃위기'];

      // 각 환자의 management_status를 자동으로 업데이트
      for (const patient of patientsData || []) {
        const lastCheckDate = lastCheckMap.get(patient.id);
        
        // 마지막 체크로부터 경과 일수 계산
        const daysSinceCheck = calculateDaysSinceLastCheck(lastCheckDate, patient.created_at);
        
        let newManagementStatus = patient.management_status || "관리 중";

        // 자동 업데이트 가능 여부 확인 (최종 상태 + 수동 설정 아웃/아웃위기 제외)
        if (shouldAutoUpdateStatus(patient.management_status, true)) {
          // 경과 일수에 따른 새 상태 계산
          newManagementStatus = calculateAutoManagementStatus(daysSinceCheck);

          // management_status가 변경되었으면 업데이트
          if (patient.management_status !== newManagementStatus) {
            await supabase
              .from("patients")
              .update({ management_status: newManagementStatus })
              .eq("id", patient.id);
          }
        } else {
          // 수동 설정된 상태 유지
          newManagementStatus = patient.management_status;
        }

        // 14일 이상이거나 수동으로 아웃/아웃위기로 설정된 환자만 리스크 환자로 추가
        if (daysSinceCheck >= 14 || manuallySetStatuses.includes(patient.management_status)) {
          riskyPatients.push({
            ...patient,
            management_status: newManagementStatus,
            last_status_date: lastCheckDate,
            days_since_last_check: daysSinceCheck,
            risk_level: newManagementStatus === "아웃" ? "아웃" : "아웃위기"
          });
        }
      }

      riskyPatients.sort((a, b) => {
        if (a.risk_level === b.risk_level) {
          return b.days_since_last_check - a.days_since_last_check;
        }
        return a.risk_level === "아웃" ? -1 : 1;
      });

      setRiskPatients(riskyPatients);

      if (riskyPatients.length > 0) {
        const patientIds = riskyPatients.map(p => p.id);
        const { data: reconnectData, error: reconnectError } = await supabase
          .from("patient_reconnect_tracking")
          .select("*")
          .in("patient_id", patientIds);

        if (reconnectError) throw reconnectError;

        const reconnectMap = new Map<string, ReconnectTracking>();
        reconnectData?.forEach(data => {
          reconnectMap.set(data.patient_id, data);
        });
        setReconnectData(reconnectMap);
      }

    } catch (error) {
      console.error("Error fetching risk patients:", error);
      toast({
        title: "오류",
        description: "이탈 리스크 환자 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReconnectToggle = async (patientId: string, checked: boolean) => {
    // 관리자 권한 체크 - 읽기 전용
    if (userRole === 'admin') {
      toast({
        title: "권한 없음",
        description: "관리자는 재연락 상태를 변경할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const existingData = reconnectData.get(patientId);

      if (existingData?.id) {
        const { error } = await supabase
          .from("patient_reconnect_tracking")
          .update({
            is_reconnected: checked,
            reconnected_at: checked ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingData.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("patient_reconnect_tracking")
          .insert({
            patient_id: patientId,
            is_reconnected: checked,
            reconnected_at: checked ? new Date().toISOString() : null,
            created_by: user?.id!
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const newMap = new Map(reconnectData);
          newMap.set(patientId, data);
          setReconnectData(newMap);
        }
      }

      const newMap = new Map(reconnectData);
      newMap.set(patientId, {
        ...existingData,
        patient_id: patientId,
        is_reconnected: checked,
        reconnected_at: checked ? new Date().toISOString() : undefined
      });
      setReconnectData(newMap);

      toast({
        title: "저장 완료",
        description: "재연락 상태가 업데이트되었습니다.",
      });
    } catch (error) {
      console.error("Error updating reconnect status:", error);
      toast({
        title: "오류",
        description: "재연락 상태 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleNotesChange = (patientId: string, notes: string) => {
    // 로컬 상태만 업데이트 (타이핑 시)
    const existingData = reconnectData.get(patientId);
    const newMap = new Map(reconnectData);
    newMap.set(patientId, {
      ...existingData,
      patient_id: patientId,
      reconnect_notes: notes
    });
    setReconnectData(newMap);
  };

  const handleNotesSave = async (patientId: string, notes: string) => {
    // 관리자 권한 체크 - 읽기 전용
    if (userRole === 'admin') {
      toast({
        title: "권한 없음",
        description: "관리자는 재연락 메모를 저장할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const existingData = reconnectData.get(patientId);

      if (existingData?.id) {
        // 기존 데이터 업데이트
        const { error } = await supabase
          .from("patient_reconnect_tracking")
          .update({
            reconnect_notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingData.id);

        if (error) throw error;

        // 로컬 상태도 업데이트하여 체크박스 상태 유지
        const newMap = new Map(reconnectData);
        newMap.set(patientId, {
          ...existingData,
          reconnect_notes: notes
        });
        setReconnectData(newMap);
      } else {
        // 새로 생성
        const { data, error } = await supabase
          .from("patient_reconnect_tracking")
          .insert({
            patient_id: patientId,
            is_reconnected: false,
            reconnect_notes: notes,
            created_by: user?.id!
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const newMap = new Map(reconnectData);
          newMap.set(patientId, data);
          setReconnectData(newMap);
        }
      }

      toast({
        title: "저장 완료",
        description: "메모가 저장되었습니다.",
      });

    } catch (error) {
      console.error("Error updating notes:", error);
      toast({
        title: "오류",
        description: "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleReturnToManagement = async (patientId: string) => {
    // 관리자 권한 체크 - 읽기 전용
    if (userRole === 'admin') {
      toast({
        title: "권한 없음",
        description: "관리자는 환자 상태를 변경할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. 환자의 management_status를 "관리 중"으로 업데이트
      const { error: updateError } = await supabase
        .from("patients")
        .update({
          management_status: "관리 중"
        })
        .eq("id", patientId);

      if (updateError) throw updateError;

      // 2. 오늘 날짜로 daily_patient_status 레코드 추가
      const { error: insertError } = await supabase
        .from("daily_patient_status")
        .insert({
          patient_id: patientId,
          status_date: new Date().toISOString().split('T')[0],
          status_type: "관리 중",
          created_by: user?.id!
        });

      if (insertError) throw insertError;

      // 환자 목록 새로고침
      await fetchRiskPatients();

      toast({
        title: "복귀 완료",
        description: "환자가 관리 중 상태로 복귀되었습니다.",
      });
    } catch (error) {
      console.error("Error returning to management:", error);
      toast({
        title: "오류",
        description: "관리 중 복귀 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const getRiskBadge = (riskLevel: "아웃" | "아웃위기") => {
    if (riskLevel === "아웃") {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          아웃
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-orange-500">
        <AlertTriangle className="w-3 h-3" />
        아웃위기
      </Badge>
    );
  };

  // 필터링된 환자 목록
  const filteredRiskPatients = riskPatients.filter(patient => {
    // 유입일 필터
    if (inflowDateStart || inflowDateEnd) {
      const patientDate = new Date(patient.created_at);
      if (inflowDateStart && patientDate < inflowDateStart) return false;
      if (inflowDateEnd && patientDate > inflowDateEnd) return false;
    }

    // 입원/외래 필터
    if (selectedVisitTypes.length > 0) {
      if (!patient.visit_type || !selectedVisitTypes.includes(patient.visit_type)) {
        return false;
      }
    }

    // 진단명 필터
    if (diagnosisSearch.trim()) {
      const diagnosisText = diagnosisSearch.toLowerCase();
      const matchesDiagnosis = 
        (patient.diagnosis_category && patient.diagnosis_category.toLowerCase().includes(diagnosisText)) ||
        (patient.diagnosis_detail && patient.diagnosis_detail.toLowerCase().includes(diagnosisText));
      
      if (!matchesDiagnosis) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">이탈 리스크 관리</h1>
          <p className="text-muted-foreground mt-1">
            2주 이상 일정 체크가 없는 유입 환자 목록
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {(userRole === 'master' || userRole === 'admin') && (
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
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              아웃 (3주+)
            </Badge>
            <span className="text-sm text-muted-foreground">
              {riskPatients.filter(p => p.risk_level === "아웃").length}명
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1 bg-orange-500">
              <AlertTriangle className="w-3 h-3" />
              아웃위기 (2주+)
            </Badge>
            <span className="text-sm text-muted-foreground">
              {riskPatients.filter(p => p.risk_level === "아웃위기").length}명
            </span>
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">유입일 범위</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !inflowDateStart && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {inflowDateStart ? format(inflowDateStart, "yyyy-MM-dd") : "시작일"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={inflowDateStart}
                      onSelect={setInflowDateStart}
                      className="pointer-events-auto"
                      disabled={(date) => inflowDateEnd ? date > inflowDateEnd : false}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !inflowDateEnd && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {inflowDateEnd ? format(inflowDateEnd, "yyyy-MM-dd") : "종료일"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={inflowDateEnd}
                      onSelect={setInflowDateEnd}
                      className="pointer-events-auto"
                      disabled={(date) => inflowDateStart ? date < inflowDateStart : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">입원/외래</label>
              <Select
                value={selectedVisitTypes.length === 1 ? selectedVisitTypes[0] : "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedVisitTypes([]);
                  } else {
                    setSelectedVisitTypes([value]);
                  }
                }}
              >
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

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">진단명 검색</label>
              <Input
                placeholder="진단명 입력..."
                value={diagnosisSearch}
                onChange={(e) => setDiagnosisSearch(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setInflowDateStart(undefined);
                setInflowDateEnd(undefined);
                setSelectedVisitTypes([]);
                setDiagnosisSearch('');
              }}
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              필터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredRiskPatients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              {riskPatients.length === 0 
                ? "이탈 리스크 환자가 없습니다." 
                : "필터 조건에 맞는 환자가 없습니다."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRiskPatients.map((patient) => {
            const trackingData = reconnectData.get(patient.id);
            return (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-xl cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setSelectedPatientDetail(patient)}
                        >
                          {patient.name}
                        </CardTitle>
                        {getRiskBadge(patient.risk_level)}
                        <span className="text-sm text-muted-foreground">
                          ({patient.days_since_last_check}일 경과)
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>고객번호: {patient.customer_number || '-'}</span>
                        {patient.age && <span>나이: {patient.age}세</span>}
                        {patient.gender && <span>성별: {patient.gender}</span>}
                      </div>
                    </div>
                    {patient.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => window.open(`tel:${patient.phone}`)}
                      >
                        <Phone className="w-4 h-4" />
                        {patient.phone}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">진단:</span>{" "}
                      <span className="text-muted-foreground">
                        {patient.diagnosis_detail || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">담당자:</span>{" "}
                      <span className="text-muted-foreground">
                        {patient.manager_name || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">마지막 체크:</span>{" "}
                      <span className="text-muted-foreground">
                        {patient.last_status_date
                          ? format(new Date(patient.last_status_date), "yyyy-MM-dd")
                          : "기록 없음"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`reconnect-${patient.id}`}
                        checked={trackingData?.is_reconnected || false}
                        onCheckedChange={(checked) =>
                          handleReconnectToggle(patient.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`reconnect-${patient.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        재연락 완료
                      </label>
                      {trackingData?.reconnected_at && (
                        <span className="text-xs text-muted-foreground">
                          ({format(new Date(trackingData.reconnected_at), "yyyy-MM-dd HH:mm")})
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">담당자 메모</label>
                      <Textarea
                        placeholder="재연락 상담 내용을 기록하세요..."
                        value={trackingData?.reconnect_notes || ""}
                        onChange={(e) => handleNotesChange(patient.id, e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotesSave(patient.id, trackingData?.reconnect_notes || "")}
                          className="flex-1"
                        >
                          메모 저장
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReturnToManagement(patient.id)}
                          className="flex-1"
                        >
                          관리 중으로 복귀
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 환자 상세정보 모달 */}
      <Dialog open={!!selectedPatientDetail} onOpenChange={() => setSelectedPatientDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">환자 상세 정보</DialogTitle>
          </DialogHeader>

          {selectedPatientDetail && (
            <div className="grid gap-4 py-4">
              {/* 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="font-medium">이름:</span>
                      <span>{selectedPatientDetail.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">고객번호:</span>
                      <span>{selectedPatientDetail.customer_number || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">나이/성별:</span>
                      <span>
                        {selectedPatientDetail.age && selectedPatientDetail.gender 
                          ? `${selectedPatientDetail.age}세/${selectedPatientDetail.gender}` 
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">연락처:</span>
                      <span>{selectedPatientDetail.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">등록일:</span>
                      <span>
                        {format(new Date(selectedPatientDetail.created_at), "yyyy-MM-dd")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">유입상태:</span>
                      <Badge variant={selectedPatientDetail.inflow_status === '유입' ? 'default' : 'secondary'}>
                        {selectedPatientDetail.inflow_status || '-'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">입원/외래:</span>
                      <span>{selectedPatientDetail.visit_type || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 진료 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">진료 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="font-medium">진단명:</span>
                      <span>{selectedPatientDetail.diagnosis_category || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">세부진단명:</span>
                      <span>{selectedPatientDetail.diagnosis_detail || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">한방주치의:</span>
                      <span>{selectedPatientDetail.korean_doctor || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">양방주치의:</span>
                      <span>{selectedPatientDetail.western_doctor || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">환자/보호자:</span>
                      <span>{selectedPatientDetail.counselor || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">담당실장:</span>
                      <span>{selectedPatientDetail.manager_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">관리 상태:</span>
                      <Badge>{selectedPatientDetail.management_status || '관리 중'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 추가 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">추가 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="font-medium">이전병원:</span>
                      <span>{selectedPatientDetail.hospital_category || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">식이:</span>
                      <span>{selectedPatientDetail.diet_info || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="font-medium">내원동기:</span>
                    <p className="text-sm text-muted-foreground">
                      {selectedPatientDetail.visit_motivation || '-'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="font-medium">CRM메모:</span>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedPatientDetail.crm_memo || '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 이탈 리스크 정보 */}
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    이탈 리스크 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="font-medium">리스크 레벨:</span>
                      {getRiskBadge(selectedPatientDetail.risk_level)}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">경과 일수:</span>
                      <span className="font-semibold text-orange-600">
                        {selectedPatientDetail.days_since_last_check}일
                      </span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="font-medium">마지막 체크:</span>
                      <span>
                        {selectedPatientDetail.last_status_date
                          ? format(new Date(selectedPatientDetail.last_status_date), "yyyy-MM-dd")
                          : "기록 없음"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


