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
import { Users, Search, Plus, Check, X } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  customer_number?: string;
  resident_number_masked?: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  first_visit_date?: string;
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

export default function PatientListManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [newTreatmentDetail, setNewTreatmentDetail] = useState('');
  const [newTreatmentAmount, setNewTreatmentAmount] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  const [viewMode, setViewMode] = useState<'full' | 'treatment-only'>('full');
  const [editingFields, setEditingFields] = useState<Record<string, any>>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');
  
  // 옵션 데이터 state
  const [diagnosisOptions, setDiagnosisOptions] = useState<Option[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<Option[]>([]);
  const [insuranceTypeOptions, setInsuranceTypeOptions] = useState<Option[]>([]);
  const [treatmentDetailOptions, setTreatmentDetailOptions] = useState<Option[]>([]);
  const [patientStatusOptions, setPatientStatusOptions] = useState<PatientStatusOption[]>([]);
  
  const { toast } = useToast();
  const { userRole } = useAuth();

  useEffect(() => {
    fetchPatients();
    fetchOptions();
    fetchCurrentUserName();
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

          // 최종 상태(사망, 상태악화, 치료종료)는 자동 업데이트하지 않음
          const finalStatuses = ['사망', '상태악화', '치료종료'];
          let newManagementStatus = patient.management_status || "관리 중";
          
          if (!finalStatuses.includes(patient.management_status)) {
            // 자동 상태 업데이트 로직 (관리 중, 아웃위기, 아웃만)
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

  const fetchTreatmentPlans = async (patientId: string) => {
    setLoadingTreatments(true);
    try {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTreatmentPlans(data || []);
    } catch (error) {
      console.error('Error fetching treatment plans:', error);
      toast({
        title: "오류",
        description: "치료 계획을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoadingTreatments(false);
    }
  };

  const addTreatmentPlan = async () => {
    // 관리자 권한 체크
    if (userRole === 'admin') {
      toast({
        title: "권한 없음",
        description: "관리자는 치료 계획을 추가할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPatientDetail || !newTreatmentDetail.trim() || !newTreatmentAmount.trim()) {
      toast({
        title: "입력 오류",
        description: "치료상세와 치료금액을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('로그인이 필요합니다.');

      const { error } = await supabase
        .from('treatment_plans')
        .insert({
          patient_id: selectedPatientDetail.id,
          treatment_detail: newTreatmentDetail.trim(),
          treatment_amount: parseFloat(newTreatmentAmount),
          created_by: user.user.id
        });

      if (error) throw error;

      // 환자의 총 수납금액 재계산 (is_paid=true인 것만)
      const { data: allPlans } = await supabase
        .from('treatment_plans')
        .select('treatment_amount, is_paid')
        .eq('patient_id', selectedPatientDetail.id);

      const totalPaidAmount = (allPlans || [])
        .filter(plan => plan.is_paid)
        .reduce((sum, plan) => sum + plan.treatment_amount, 0);

      // patients 테이블의 payment_amount 업데이트
      await supabase
        .from('patients')
        .update({ payment_amount: totalPaidAmount })
        .eq('id', selectedPatientDetail.id);

      setNewTreatmentDetail('');
      setNewTreatmentAmount('');
      setShowAddForm(false);
      fetchTreatmentPlans(selectedPatientDetail.id);
      fetchPatients(); // 환자 리스트를 새로고침하여 수납금액 반영
      
      toast({
        title: "성공",
        description: "치료 계획이 추가되었습니다.",
      });
    } catch (error) {
      console.error('Error adding treatment plan:', error);
      toast({
        title: "오류",
        description: "치료 계획 추가에 실패했습니다.",
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

      // Update patients list
      setPatients(prev => prev.map(p => 
        p.id === selectedPatientDetail.id ? { ...p, [field]: value } : p
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

  const togglePaymentStatus = async (treatmentPlan: TreatmentPlan) => {
    // 관리자 권한 체크
    if (userRole === 'admin') {
      toast({
        title: "권한 없음",
        description: "관리자는 수납 상태를 변경할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('treatment_plans')
        .update({
          is_paid: !treatmentPlan.is_paid,
          payment_date: !treatmentPlan.is_paid ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', treatmentPlan.id);

      if (error) throw error;

      // Update total payment amount in patients table
      const paidAmount = treatmentPlans
        .filter(tp => tp.id !== treatmentPlan.id && tp.is_paid)
        .reduce((sum, tp) => sum + tp.treatment_amount, 0) + 
        (!treatmentPlan.is_paid ? treatmentPlan.treatment_amount : 0);

      await supabase
        .from('patients')
        .update({ payment_amount: paidAmount })
        .eq('id', selectedPatientDetail!.id);

      fetchTreatmentPlans(selectedPatientDetail!.id);
      fetchPatients(); // Refresh patient list to show updated payment amount
      
      toast({
        title: "성공",
        description: `수납 상태가 ${!treatmentPlan.is_paid ? '완료' : '미완료'}로 변경되었습니다.`,
      });
    } catch (error) {
      console.error('Error toggling payment status:', error);
      toast({
        title: "오류",
        description: "수납 상태 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const getTotalPaymentStats = () => {
    const totalAmount = treatmentPlans.reduce((sum, tp) => sum + tp.treatment_amount, 0);
    const paidAmount = treatmentPlans.filter(tp => tp.is_paid).reduce((sum, tp) => sum + tp.treatment_amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    
    return { totalAmount, paidAmount, unpaidAmount };
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
        <h3 className="text-lg font-semibold">치료 계획 관리</h3>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 치료 계획 추가
        </Button>
      </div>

      {/* 수납 현황 요약 */}
      {treatmentPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">총 치료비</p>
                <p className="text-lg font-semibold">
                  {getTotalPaymentStats().totalAmount.toLocaleString()}원
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">수납완료</p>
                <p className="text-lg font-semibold text-green-600">
                  {getTotalPaymentStats().paidAmount.toLocaleString()}원
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">미수납</p>
                <p className="text-lg font-semibold text-red-600">
                  {getTotalPaymentStats().unpaidAmount.toLocaleString()}원
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 새 치료 계획 추가 폼 */}
      {showAddForm && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">새 치료 계획 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="treatment-detail">치료상세</Label>
              <Select value={newTreatmentDetail} onValueChange={setNewTreatmentDetail}>
                <SelectTrigger>
                  <SelectValue placeholder="치료상세를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-background">
                  {treatmentDetailOptions.map(option => (
                    <SelectItem key={option.id} value={option.name}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="treatment-amount">치료금액</Label>
              <Input
                id="treatment-amount"
                type="number"
                placeholder="치료금액을 입력하세요"
                value={newTreatmentAmount}
                onChange={(e) => setNewTreatmentAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addTreatmentPlan} size="sm">
                <Check className="h-4 w-4 mr-2" />
                추가
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setNewTreatmentDetail('');
                  setNewTreatmentAmount('');
                }}
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 치료 계획 리스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">치료 계획 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTreatments ? (
            <div className="text-center py-4 text-muted-foreground">
              치료 계획을 불러오는 중...
            </div>
          ) : treatmentPlans.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              등록된 치료 계획이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {treatmentPlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{plan.treatment_detail}</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.treatment_amount.toLocaleString()}원 • {new Date(plan.created_at).toLocaleDateString('ko-KR')}
                    </p>
                    {plan.is_paid && plan.payment_date && (
                      <p className="text-xs text-green-600">
                        수납완료: {new Date(plan.payment_date).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`payment-${plan.id}`}
                        checked={plan.is_paid}
                        onCheckedChange={() => togglePaymentStatus(plan)}
                      />
                      <Label htmlFor={`payment-${plan.id}`} className="text-sm">
                        수납완료
                      </Label>
                    </div>
                    <Badge variant={plan.is_paid ? "default" : "outline"}>
                      {plan.is_paid ? "수납완료" : "미수납"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
                  return (
                    <TableRow 
                      key={patient.id}
                      className={`cursor-pointer hover:bg-muted/50 ${bgColor}`}
                      onClick={() => {
                        setSelectedPatientDetail(patient);
                        setViewMode('full');
                        fetchTreatmentPlans(patient.id);
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
                      {patient.first_visit_date ? 
                        new Date(patient.first_visit_date).toLocaleDateString('ko-KR') : 
                        new Date(patient.created_at).toLocaleDateString('ko-KR')
                      }
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
                            fetchTreatmentPlans(patient.id);
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
        setTreatmentPlans([]);
        setShowAddForm(false);
        setNewTreatmentDetail('');
        setNewTreatmentAmount('');
        setViewMode('full');
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPatientDetail?.name} - {viewMode === 'full' ? '환자 상세정보' : '치료 계획 관리'}
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
                        savePatientField('patient_or_guardian', value);
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
                      onBlur={(e) => savePatientField('diet_info', e.target.value)}
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
                        savePatientField('inflow_status', value);
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

                  {/* 초진일자 */}
                  <div>
                    <Label>초진일자</Label>
                    <Input
                      type="date"
                      value={selectedPatientDetail?.first_visit_date || ''}
                      onChange={(e) => updateEditingField('first_visit_date', e.target.value)}
                      onBlur={(e) => savePatientField('first_visit_date', e.target.value)}
                    />
                  </div>

                  {/* 내원형태 */}
                  <div>
                    <Label>내원형태</Label>
                    <Select
                      value={selectedPatientDetail?.visit_type || ''}
                      onValueChange={(value) => {
                        updateEditingField('visit_type', value);
                        savePatientField('visit_type', value);
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
                      onBlur={(e) => savePatientField('guardian_name', e.target.value)}
                      placeholder="보호자 이름"
                    />
                  </div>

                  {/* 보호자 관계 */}
                  <div>
                    <Label>보호자 관계</Label>
                    <Input
                      value={selectedPatientDetail?.guardian_relationship || ''}
                      onChange={(e) => updateEditingField('guardian_relationship', e.target.value)}
                      onBlur={(e) => savePatientField('guardian_relationship', e.target.value)}
                      placeholder="보호자 관계"
                    />
                  </div>

                  {/* 보호자 연락처 */}
                  <div>
                    <Label>보호자 연락처</Label>
                    <Input
                      value={selectedPatientDetail?.guardian_phone || ''}
                      onChange={(e) => updateEditingField('guardian_phone', e.target.value)}
                      onBlur={(e) => savePatientField('guardian_phone', e.target.value)}
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
                      onBlur={(e) => savePatientField('korean_doctor', e.target.value)}
                      placeholder="한방주치의"
                    />
                  </div>

                  {/* 양방주치의 */}
                  <div>
                    <Label>양방주치의</Label>
                    <Input
                      value={selectedPatientDetail?.western_doctor || ''}
                      onChange={(e) => updateEditingField('western_doctor', e.target.value)}
                      onBlur={(e) => savePatientField('western_doctor', e.target.value)}
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
                        savePatientField('insurance_type', value);
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
                        savePatientField('management_status', value);
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
                      onBlur={(e) => savePatientField('hospital_treatment', e.target.value)}
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
                      onBlur={(e) => savePatientField('examination_schedule', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="treatment-plan">치료 계획</Label>
                    <Textarea
                      id="treatment-plan"
                      placeholder="치료 계획을 입력하세요"
                      value={selectedPatientDetail?.treatment_plan || ''}
                      onChange={(e) => updateEditingField('treatment_plan', e.target.value)}
                      onBlur={(e) => savePatientField('treatment_plan', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* 치료 계획 관리 섹션 */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4 text-primary">치료 계획 관리</h2>
                {renderTreatmentManagement()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}