import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, RefreshCw, Package as PackageIcon } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  customer_number?: string;
  resident_number_masked?: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  last_visit_date?: string;
  inflow_status?: string;
  visit_type?: string;
  visit_motivation?: string;
  diagnosis_category?: string;
  diagnosis_detail?: string;
  counselor?: string;
  hospital_category?: string;
  hospital_branch?: string;
  diet_info?: string;
  manager_name?: string;
  korean_doctor?: string;
  western_doctor?: string;
  insurance_type?: string;
  hospital_treatment?: string;
  examination_schedule?: string;
  treatment_plan?: string;
  monthly_avg_inpatient_days?: number;
  monthly_avg_outpatient_days?: number;
  payment_amount?: number;
  crm_memo?: string;
  patient_or_guardian?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  management_status?: string;
  memo1?: string;
  created_at: string;
}

interface TreatmentPlan {
  id: string;
  patient_id: string;
  treatment_detail: string;
  treatment_amount: number;
  is_paid: boolean;
  payment_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface Option {
  id: string;
  name: string;
}

interface PatientStatusOption extends Option {
  exclude_from_daily_tracking: boolean;
}

interface PackageManagement {
  id: string;
  patient_id: string;
  customer_number?: string;
  deposit_total: number;
  deposit_used: number;
  deposit_balance: number;
  reward_total: number;
  reward_used: number;
  reward_balance: number;
  count_total: number;
  count_used: number;
  count_balance: number;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export default function PatientListManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'treatment-only'>('full');
  const [editingFields, setEditingFields] = useState<Record<string, any>>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');
  
  // 옵션 데이터 state
  const [diagnosisOptions, setDiagnosisOptions] = useState<Option[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<Option[]>([]);
  const [insuranceTypeOptions, setInsuranceTypeOptions] = useState<Option[]>([]);
  const [treatmentDetailOptions, setTreatmentDetailOptions] = useState<Option[]>([]);
  const [patientStatusOptions, setPatientStatusOptions] = useState<PatientStatusOption[]>([]);
  const [packageData, setPackageData] = useState<PackageManagement | null>(null);
  const [syncingPackage, setSyncingPackage] = useState(false);
  
  const { toast } = useToast();
  const { userRole } = useAuth();

  useEffect(() => {
    fetchPatients();
    fetchOptions();
    fetchCurrentUserName();
    
    // CRM에서 postMessage로 패키지 데이터 수신
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'crm-package-data') {
        handlePackageDataReceived(event.data.data);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.customer_number && patient.customer_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.phone && patient.phone.includes(searchTerm)) ||
      (patient.manager_name && patient.manager_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.western_doctor && patient.western_doctor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.korean_doctor && patient.korean_doctor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.visit_type && patient.visit_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.hospital_category && patient.hospital_category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('inflow_status', '유입')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // 모든 환자의 일별 상태 데이터 가져오기
      const { data: allStatusData } = await supabase
        .from('daily_patient_status')
        .select('patient_id, status_date, status_type')
        .order('status_date', { ascending: false });

      // 각 환자의 마지막 체크 날짜 맵 생성
      const lastCheckMap = new Map<string, string>();
      allStatusData?.forEach(status => {
        if (!lastCheckMap.has(status.patient_id)) {
          lastCheckMap.set(status.patient_id, status.status_date);
        }
      });

      const today = new Date();
      
      // 각 환자의 일별 상태 데이터를 가져와서 통계 계산 및 management_status 자동 업데이트
      const patientsWithStats = await Promise.all(
        (data || []).map(async (patient) => {
          const { data: statusData } = await supabase
            .from('daily_patient_status')
            .select('status_date, status_type')
            .eq('patient_id', patient.id)
            .order('status_date', { ascending: false });

          // 마지막 내원일 (가장 최근 상태 날짜)
          const last_visit_date = statusData && statusData.length > 0 
            ? statusData[0].status_date 
            : null;

          // management_status 자동 업데이트 로직
          const lastCheckDate = lastCheckMap.get(patient.id);
          let daysSinceCheck = 0;

          if (!lastCheckDate) {
            const createdDate = new Date(patient.created_at);
            daysSinceCheck = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          } else {
            const lastDate = new Date(lastCheckDate);
            daysSinceCheck = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          }

          // 최종 상태(사망, 상태악화, 치료종료, 아웃, 아웃위기)는 자동 업데이트하지 않음
          // 사용자가 수동으로 설정한 상태는 유지되어야 함
          const finalStatuses = ['사망', '상태악화', '치료종료', '아웃', '아웃위기'];
          let newManagementStatus = patient.management_status || "관리 중";
          
          if (!finalStatuses.includes(patient.management_status)) {
            // 자동 상태 업데이트 로직 (관리 중만 자동 업데이트)
            if (daysSinceCheck >= 21) {
              newManagementStatus = "아웃";
            } else if (daysSinceCheck >= 14) {
              newManagementStatus = "아웃위기";
            } else {
              newManagementStatus = "관리 중";
            }

            // management_status가 변경되었으면 업데이트
            if (patient.management_status !== newManagementStatus) {
              await supabase
                .from("patients")
                .update({ management_status: newManagementStatus })
                .eq("id", patient.id);
            }
          }

          // 월평균 입원/외래 일수 계산
          let monthly_avg_inpatient_days = 0;
          let monthly_avg_outpatient_days = 0;
          
          if (statusData && statusData.length > 0) {
            // 입원 관련: 입원, 재입원, 낮병동
            const inpatientStatuses = ['입원', '재입원', '낮병동'];
            const inpatientDays = statusData.filter(s => inpatientStatuses.includes(s.status_type));
            
            // 외래 관련: 외래
            const outpatientStatuses = ['외래'];
            const outpatientDays = statusData.filter(s => outpatientStatuses.includes(s.status_type));
            
            // 전체 기간 계산 (첫 기록부터 마지막 기록까지)
            const allRelevantDays = [...inpatientDays, ...outpatientDays];
            if (allRelevantDays.length > 0) {
              const dates = allRelevantDays.map(s => new Date(s.status_date));
              const firstDate = new Date(Math.min(...dates.map(d => d.getTime())));
              const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));
              const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 
                + (lastDate.getMonth() - firstDate.getMonth()) + 1;
              
              monthly_avg_inpatient_days = inpatientDays.length > 0 
                ? Math.round(inpatientDays.length / monthsDiff) 
                : 0;
              monthly_avg_outpatient_days = outpatientDays.length > 0 
                ? Math.round(outpatientDays.length / monthsDiff) 
                : 0;
            }
          }

          return {
            ...patient,
            management_status: newManagementStatus,
            last_visit_date,
            monthly_avg_inpatient_days,
            monthly_avg_outpatient_days
          };
        })
      );

      setPatients(patientsWithStats);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "오류",
        description: "관리 환자 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [diagnosis, hospital, insurance, treatment, patientStatus] = await Promise.all([
        supabase.from('diagnosis_options').select('*').order('name'),
        supabase.from('hospital_options').select('*').order('name'),
        supabase.from('insurance_type_options').select('*').order('name'),
        supabase.from('treatment_detail_options').select('*').order('name'),
        supabase.from('patient_status_options').select('*').order('name')
      ]);

      if (diagnosis.data) setDiagnosisOptions(diagnosis.data);
      if (hospital.data) setHospitalOptions(hospital.data);
      if (insurance.data) setInsuranceTypeOptions(insurance.data);
      if (treatment.data) setTreatmentDetailOptions(treatment.data);
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

  const fetchPackageData = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('package_management')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error) throw error;
      setPackageData(data);
    } catch (error) {
      console.error('Error fetching package data:', error);
    }
  };

  const handleSyncPackage = () => {
    if (!selectedPatientDetail?.customer_number) {
      toast({
        title: "오류",
        description: "고객번호가 없어 패키지 정보를 가져올 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setSyncingPackage(true);
    
    const data = {
      customerNumber: selectedPatientDetail.customer_number,
      patientId: selectedPatientDetail.id,
      appUrl: window.location.origin + '/patient-list'
    };
    
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const crmUrl = `http://192.168.1.101/html/MEDI20/main.html#package_data=${encoded}`;
    
    window.open(crmUrl, '_blank');
    
    toast({
      title: "CRM 페이지 열기",
      description: "CRM 패키지 관리 페이지에서 '패키지 연동' 북마크를 클릭하세요.",
    });
    
    setTimeout(() => setSyncingPackage(false), 3000);
  };

  const handlePackageDataReceived = async (data: any) => {
    console.log('📦 패키지 데이터 수신:', data);
    
    if (!data || !data.customerNumber) {
      console.error('Invalid package data received:', data);
      return;
    }

    try {
      // 고객번호로 환자 찾기
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('customer_number', data.customerNumber)
        .maybeSingle();

      if (patientError) throw patientError;
      
      if (!patient) {
        toast({
          title: "오류",
          description: "해당 고객번호의 환자를 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ 환자 찾음:', patient.id);

      // 패키지 데이터 UPSERT
      const packagePayload = {
        patient_id: patient.id,
        customer_number: data.customerNumber,
        deposit_total: data.depositTotal || 0,
        deposit_used: data.depositUsed || 0,
        deposit_balance: data.depositBalance || 0,
        reward_total: data.rewardTotal || 0,
        reward_used: data.rewardUsed || 0,
        reward_balance: data.rewardBalance || 0,
        count_total: data.countTotal || 0,
        count_used: data.countUsed || 0,
        count_balance: data.countBalance || 0,
        last_synced_at: data.lastSyncedAt || new Date().toISOString(),
      };

      console.log('💾 저장할 패키지 데이터:', packagePayload);

      const { error: upsertError } = await supabase
        .from('package_management')
        .upsert(packagePayload, { onConflict: 'patient_id' });

      if (upsertError) throw upsertError;

      // 항상 패키지 데이터 갱신 (현재 선택된 환자인 경우)
      if (selectedPatientDetail?.id === patient.id) {
        console.log('🔄 현재 선택된 환자의 패키지 데이터 갱신 중...');
        await fetchPackageData(patient.id);
      }

      toast({
        title: "패키지 정보 업데이트 완료",
        description: "CRM에서 패키지 정보를 성공적으로 가져왔습니다.",
      });
    } catch (error) {
      console.error('Error saving package data:', error);
      toast({
        title: "오류",
        description: "패키지 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const updateEditingField = (field: string, value: any) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
    setSelectedPatientDetail(prev => prev ? { ...prev, [field]: value } : null);
  };

  const savePatientField = async (field: string, value: any) => {
    if (!selectedPatientDetail) return;

    // 관리자 권한 체크
    if (userRole === 'admin') {
      toast({
        title: "권한 없음",
        description: "관리자는 환자 정보를 수정할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('patients')
        .update({ [field]: value })
        .eq('id', selectedPatientDetail.id);

      if (error) throw error;

      // Update patients list with management_status to trigger background color update
      setPatients(prev => prev.map(p => 
        p.id === selectedPatientDetail.id ? { ...p, [field]: value, management_status: field === 'management_status' ? value : p.management_status } : p
      ));

      // Remove from editing fields
      setEditingFields(prev => {
        const newFields = { ...prev };
        delete newFields[field];
        return newFields;
      });

      toast({
        title: "성공",
        description: "정보가 저장되었습니다.",
      });
    } catch (error) {
      console.error('Error updating patient field:', error);
      toast({
        title: "오류",
        description: "정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const saveAllEditingFields = async () => {
    if (!selectedPatientDetail || Object.keys(editingFields).length === 0) return;

    // 관리자 권한 체크
    if (userRole === 'admin') {
      toast({
        title: "권한 없음",
        description: "관리자는 환자 정보를 수정할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 모든 편집된 필드를 한 번에 업데이트
      const { error } = await supabase
        .from('patients')
        .update(editingFields)
        .eq('id', selectedPatientDetail.id);

      if (error) throw error;

      // Update patients list including management_status
      setPatients(prev => prev.map(p => 
        p.id === selectedPatientDetail.id ? { ...p, ...editingFields } : p
      ));

      // Update selected patient detail
      setSelectedPatientDetail(prev => prev ? { ...prev, ...editingFields } : null);

      // Clear editing fields
      setEditingFields({});

      toast({
        title: "성공",
        description: "정보가 저장되었습니다.",
      });
    } catch (error) {
      console.error('Error updating patient fields:', error);
      toast({
        title: "오류",
        description: "정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  // 관리 상태가 일별 관리에서 제외되는지 확인하는 함수
  const isExcludedFromTracking = (managementStatus?: string) => {
    if (!managementStatus) return false;
    const statusOption = patientStatusOptions.find(opt => opt.name === managementStatus);
    return statusOption?.exclude_from_daily_tracking || false;
  };

  // 관리 상태에 따른 배경색 반환
  const getManagementStatusBgColor = (managementStatus?: string) => {
    if (!managementStatus) return '';
    
    switch (managementStatus) {
      case '아웃위기':
        return 'bg-orange-100 dark:bg-orange-950/30';
      case '아웃':
        return 'bg-red-100 dark:bg-red-950/30';
      default:
        // 다른 exclude_from_daily_tracking 상태들 (사망, 치료종료 등)
        const statusOption = patientStatusOptions.find(opt => opt.name === managementStatus);
        if (statusOption?.exclude_from_daily_tracking) {
          return 'bg-pink-100 dark:bg-pink-950/30';
        }
        return '';
    }
  };

  const getInflowStatusColor = (status?: string) => {
    switch (status) {
      case '유입':
        return 'default';
      case '상담':
        return 'secondary';
      case '입원':
        return 'destructive';
      case '퇴원':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const renderTreatmentManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <PackageIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">패키지 관리</h3>
        </div>
        <Button
          onClick={handleSyncPackage}
          disabled={syncingPackage || !selectedPatientDetail?.customer_number}
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncingPackage ? 'animate-spin' : ''}`} />
          최신화
        </Button>
      </div>

      {!selectedPatientDetail?.customer_number ? (
        <div className="text-center py-8 text-muted-foreground">
          고객번호가 없어 패키지 정보를 가져올 수 없습니다.
        </div>
      ) : !packageData ? (
        <div className="text-center py-8 text-muted-foreground">
          최신화 버튼을 클릭하여 CRM에서 패키지 정보를 가져오세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 예수금 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">예수금</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">총 입금액:</span>
                <span className="font-semibold">{packageData.deposit_total.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">사용액:</span>
                <span className="text-red-600">{packageData.deposit_used.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-semibold">잔액:</span>
                <span className="text-lg font-bold text-primary">
                  {packageData.deposit_balance.toLocaleString()}원
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 적립금 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">적립금</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">총 적립액:</span>
                <span className="font-semibold">{packageData.reward_total.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">사용액:</span>
                <span className="text-red-600">{packageData.reward_used.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-semibold">잔액:</span>
                <span className="text-lg font-bold text-primary">
                  {packageData.reward_balance.toLocaleString()}원
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 횟수 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">횟수</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">총 입력:</span>
                <span className="font-semibold">{packageData.count_total}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">사용:</span>
                <span className="text-red-600">{packageData.count_used}회</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-semibold">잔여:</span>
                <span className="text-lg font-bold text-primary">
                  {packageData.count_balance}회
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {packageData?.last_synced_at && (
        <div className="text-xs text-muted-foreground text-right">
          마지막 동기화: {new Date(packageData.last_synced_at).toLocaleString('ko-KR')}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  return (
    <div className="max-w-none mx-auto p-6 w-full">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">관리 환자 리스트</h1>
      </div>

      <Card className="w-full overflow-x-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>유입 환자 목록 ({filteredPatients.length}명)</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="환자명, 차트번호, 담당자, 주치의, 입원/외래, 이전병원으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>고객번호</TableHead>
                  <TableHead>외래/입원구분</TableHead>
                  <TableHead>담당실장</TableHead>
                  <TableHead>환자명</TableHead>
                  <TableHead>진단명</TableHead>
                  <TableHead>유입일</TableHead>
                  <TableHead>실비보험유형</TableHead>
                  <TableHead>본병원치료</TableHead>
                  <TableHead>본병원검사일정</TableHead>
                  <TableHead>우리병원치료계획</TableHead>
                  <TableHead>월평균입원일수</TableHead>
                  <TableHead>월평균외래일수</TableHead>
                  <TableHead>마지막내원일</TableHead>
                  <TableHead>수납급액(비급여)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const bgColor = getManagementStatusBgColor((patient as any).management_status);
                  const isOut = isExcludedFromTracking((patient as any).management_status);
                  return (
                    <TableRow 
                      key={patient.id}
                      className={`cursor-pointer hover:bg-muted/50 ${bgColor} ${isOut ? 'italic' : ''}`}
                      onClick={() => {
                        setSelectedPatientDetail(patient);
                        setViewMode('full');
                        fetchPackageData(patient.id);
                      }}
                    >
                    <TableCell className="font-mono">{patient.customer_number || '-'}</TableCell>
                    <TableCell>{patient.visit_type || '-'}</TableCell>
                    <TableCell>{patient.manager_name || '-'}</TableCell>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.diagnosis_category || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(patient.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>{patient.insurance_type || '-'}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.hospital_treatment || '-'}
                    </TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.examination_schedule || '-'}
                    </TableCell>
                    <TableCell className="max-w-32">
                      <div className="flex items-center gap-2">
                        <span className="truncate flex-1">
                          {patient.treatment_plan || '-'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatientDetail(patient);
                            setViewMode('treatment-only');
                            fetchPackageData(patient.id);
                          }}
                          className="px-2 py-1 h-6 text-xs"
                        >
                          상세보기
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {patient.monthly_avg_inpatient_days ? `${patient.monthly_avg_inpatient_days}일` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {patient.monthly_avg_outpatient_days ? `${patient.monthly_avg_outpatient_days}일` : '-'}
                    </TableCell>
                    <TableCell>
                      {patient.last_visit_date ? 
                        new Date(patient.last_visit_date).toLocaleDateString('ko-KR') : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {patient.payment_amount ? 
                        `${patient.payment_amount.toLocaleString()}원` : '-'
                      }
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? '검색 결과가 없습니다.' : '유입된 환자가 없습니다.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 환자 상세정보 모달 다이얼로그 */}
      <Dialog open={!!selectedPatientDetail} onOpenChange={() => {
        setSelectedPatientDetail(null);
        setViewMode('full');
        setPackageData(null);
        setEditingFields({});
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPatientDetail?.name} - {viewMode === 'full' ? '환자 상세정보' : '패키지 관리'}
            </DialogTitle>
          </DialogHeader>
          
          {viewMode === 'treatment-only' ? (
            <div className="mt-4">
              {renderTreatmentManagement()}
            </div>
          ) : (
            <div className="mt-4 space-y-6">
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
                        {insuranceTypeOptions.map(option => (
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
                        {patientStatusOptions.map(option => (
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
                       패키지 관리에서 자동 계산
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

                  {/* 담당자 메모 */}
                  <div className="md:col-span-2">
                    <Label htmlFor="manager-memo">담당자 메모</Label>
                    <Textarea
                      id="manager-memo"
                      placeholder="담당자 메모를 입력하세요"
                      value={selectedPatientDetail?.memo1 || ''}
                      onChange={(e) => updateEditingField('memo1', e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      일별 환자 관리 현황의 메모칸과 연동됩니다
                    </p>
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
                    disabled={Object.keys(editingFields).length === 0 || userRole === 'admin'}
                  >
                    수정 저장
                  </Button>
                </div>
              </div>

              {/* 패키지 관리 섹션 */}
              <div className="border-t pt-6">
                {renderTreatmentManagement()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}