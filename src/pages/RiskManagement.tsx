import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Phone } from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  patient_number: string;
  name: string;
  phone?: string;
  age?: number;
  gender?: string;
  detailed_diagnosis?: string;
  manager_name?: string;
  inflow_status?: string;
  last_status_date?: string;
  days_since_last_check: number;
  risk_level: "아웃" | "아웃위기";
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
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRiskPatients();
    
    // Realtime 구독
    const channel = supabase
      .channel('risk-management-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_patient_status'
        },
        () => {
          fetchRiskPatients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  const fetchRiskPatients = async () => {
    try {
      setLoading(true);

      // 1. 환자 목록 조회
      let patientsQuery = supabase
        .from("patients")
        .select("*")
        .eq("inflow_status", "유입");

      if (userRole !== "master") {
        patientsQuery = patientsQuery.eq("assigned_manager", user?.id);
      }

      const { data: patientsData, error: patientsError } = await patientsQuery;

      if (patientsError) throw patientsError;

      // 2. 모든 환자의 마지막 일별 체크 날짜 조회
      const { data: statusData, error: statusError } = await supabase
        .from("daily_patient_status")
        .select("patient_id, status_date")
        .order("status_date", { ascending: false });

      if (statusError) throw statusError;

      // 3. 각 환자의 마지막 체크 날짜 찾기
      const lastCheckMap = new Map<string, string>();
      statusData?.forEach(status => {
        if (!lastCheckMap.has(status.patient_id)) {
          lastCheckMap.set(status.patient_id, status.status_date);
        }
      });

      // 4. 리스크 환자 필터링
      const today = new Date();
      const riskyPatients: Patient[] = [];

      patientsData?.forEach(patient => {
        const lastCheckDate = lastCheckMap.get(patient.id);
        
        if (!lastCheckDate) {
          // 한 번도 체크 안된 경우 - 생성일로부터 계산
          const createdDate = new Date(patient.created_at);
          const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceCreated >= 14) {
            riskyPatients.push({
              ...patient,
              last_status_date: undefined,
              days_since_last_check: daysSinceCreated,
              risk_level: daysSinceCreated >= 21 ? "아웃" : "아웃위기"
            });
          }
        } else {
          const lastDate = new Date(lastCheckDate);
          const daysSinceCheck = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSinceCheck >= 14) {
            riskyPatients.push({
              ...patient,
              last_status_date: lastCheckDate,
              days_since_last_check: daysSinceCheck,
              risk_level: daysSinceCheck >= 21 ? "아웃" : "아웃위기"
            });
          }
        }
      });

      // 리스크 레벨과 일수로 정렬 (아웃 > 아웃위기, 일수 많은 순)
      riskyPatients.sort((a, b) => {
        if (a.risk_level === b.risk_level) {
          return b.days_since_last_check - a.days_since_last_check;
        }
        return a.risk_level === "아웃" ? -1 : 1;
      });

      setRiskPatients(riskyPatients);

      // 5. 재연락 데이터 조회
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
    try {
      const existingData = reconnectData.get(patientId);

      if (existingData?.id) {
        // 업데이트
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
        // 새로 생성
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

        // 새로 생성된 데이터를 Map에 추가
        if (data) {
          const newMap = new Map(reconnectData);
          newMap.set(patientId, data);
          setReconnectData(newMap);
        }
      }

      // 로컬 상태 업데이트
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

  const handleNotesChange = async (patientId: string, notes: string) => {
    try {
      const existingData = reconnectData.get(patientId);

      if (existingData?.id) {
        // 업데이트
        const { error } = await supabase
          .from("patient_reconnect_tracking")
          .update({
            reconnect_notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingData.id);

        if (error) throw error;
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

      // 로컬 상태 업데이트
      const newMap = new Map(reconnectData);
      newMap.set(patientId, {
        ...existingData,
        patient_id: patientId,
        reconnect_notes: notes
      });
      setReconnectData(newMap);

    } catch (error) {
      console.error("Error updating notes:", error);
      toast({
        title: "오류",
        description: "메모 저장 중 오류가 발생했습니다.",
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
        <div className="flex gap-4">
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

      {riskPatients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">이탈 리스크 환자가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {riskPatients.map((patient) => {
            const trackingData = reconnectData.get(patient.id);
            return (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{patient.name}</CardTitle>
                        {getRiskBadge(patient.risk_level)}
                        <span className="text-sm text-muted-foreground">
                          ({patient.days_since_last_check}일 경과)
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>환자번호: {patient.patient_number}</span>
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
                        {patient.detailed_diagnosis || "-"}
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
                        onBlur={(e) => {
                          if (e.target.value !== trackingData?.reconnect_notes) {
                            toast({
                              title: "저장 완료",
                              description: "메모가 저장되었습니다.",
                            });
                          }
                        }}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
