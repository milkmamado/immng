import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PatientBasicFormProps {
  patient?: any;
  onClose: () => void;
}

export function PatientBasicForm({ patient, onClose }: PatientBasicFormProps) {
  const [formData, setFormData] = useState({
    // 기본 정보
    name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    resident_number_masked: '',
    
    // 유입 정보
    inflow_status: '유입',
    visit_motivation: '',
    visit_type: '',
    referral_source: '',
    
    // 진단 정보
    detailed_diagnosis: '',
    counselor: '',
    previous_hospital: '',
    diet_info: '',
    korean_doctor: '',
    western_doctor: '',
    counseling_content: '',
    
    // 관리 정보
    chart_number: '',
    insurance_type: '',
    hospital_treatment: '',
    examination_schedule: '',
    treatment_plan: '',
    monthly_avg_days: '',
    last_visit_date: '',
    payment_amount: '',
    manager_name: '',
    
    // 보호자 정보
    guardian_name: '',
    guardian_relationship: '',
    guardian_phone: '',
    emergency_contact: '',
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        age: patient.age?.toString() || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        address: patient.address || '',
        resident_number_masked: patient.resident_number_masked || '',
        inflow_status: patient.inflow_status || '유입',
        visit_motivation: patient.visit_motivation || '',
        visit_type: patient.visit_type || '',
        referral_source: patient.referral_source || '',
        detailed_diagnosis: patient.detailed_diagnosis || '',
        counselor: patient.counselor || '',
        previous_hospital: patient.previous_hospital || '',
        diet_info: patient.diet_info || '',
        korean_doctor: patient.korean_doctor || '',
        western_doctor: patient.western_doctor || '',
        counseling_content: patient.counseling_content || '',
        chart_number: patient.chart_number || '',
        insurance_type: patient.insurance_type || '',
        hospital_treatment: patient.hospital_treatment || '',
        examination_schedule: patient.examination_schedule || '',
        treatment_plan: patient.treatment_plan || '',
        monthly_avg_days: patient.monthly_avg_days?.toString() || '',
        last_visit_date: patient.last_visit_date || '',
        payment_amount: patient.payment_amount?.toString() || '',
        manager_name: patient.manager_name || '',
        guardian_name: patient.guardian_name || '',
        guardian_relationship: patient.guardian_relationship || '',
        guardian_phone: patient.guardian_phone || '',
        emergency_contact: patient.emergency_contact || '',
      });
    }
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const submitData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        monthly_avg_days: formData.monthly_avg_days ? parseInt(formData.monthly_avg_days) : 0,
        payment_amount: formData.payment_amount ? parseFloat(formData.payment_amount) : 0,
        assigned_manager: user.id,
      };

      if (patient) {
        const { error } = await supabase
          .from('patients')
          .update(submitData)
          .eq('id', patient.id);
        
        if (error) throw error;
        
        toast({
          title: "성공",
          description: "환자 정보가 수정되었습니다.",
        });
      } else {
        // 새 환자 등록 시 환자번호 생성
        const { data: patientNumberData, error: numberError } = await supabase
          .rpc('generate_patient_number');
        
        if (numberError) throw numberError;
        
        const finalSubmitData = {
          ...submitData,
          patient_number: patientNumberData
        };
        
        const { error } = await supabase
          .from('patients')
          .insert([finalSubmitData]);
        
        if (error) throw error;
        
        toast({
          title: "성공",
          description: "환자가 등록되었습니다.",
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast({
        title: "오류",
        description: "환자 정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {patient ? '환자 정보 수정' : '환자 등록'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">기본정보</TabsTrigger>
              <TabsTrigger value="medical">진료정보</TabsTrigger>
              <TabsTrigger value="management">관리정보</TabsTrigger>
              <TabsTrigger value="guardian">보호자정보</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>기본 환자 정보</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">환자명 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="age">나이</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => updateFormData('age', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender">성별</Label>
                      <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="성별 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="남성">남성</SelectItem>
                          <SelectItem value="여성">여성</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phone">전화번호</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">주소</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="inflow_status">유입/실패</Label>
                      <Select value={formData.inflow_status} onValueChange={(value) => updateFormData('inflow_status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="유입">유입</SelectItem>
                          <SelectItem value="실패">실패</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="visit_type">입원/외래</Label>
                      <Select value={formData.visit_type} onValueChange={(value) => updateFormData('visit_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="입원/외래 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="입원">입원</SelectItem>
                          <SelectItem value="외래">외래</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="visit_motivation">내원동기</Label>
                    <Textarea
                      id="visit_motivation"
                      value={formData.visit_motivation}
                      onChange={(e) => updateFormData('visit_motivation', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medical">
              <Card>
                <CardHeader>
                  <CardTitle>진료 정보</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div>
                    <Label htmlFor="detailed_diagnosis">세부진단명</Label>
                    <Input
                      id="detailed_diagnosis"
                      value={formData.detailed_diagnosis}
                      onChange={(e) => updateFormData('detailed_diagnosis', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="counselor">내담자</Label>
                      <Input
                        id="counselor"
                        value={formData.counselor}
                        onChange={(e) => updateFormData('counselor', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="previous_hospital">이전병원(본원)</Label>
                      <Input
                        id="previous_hospital"
                        value={formData.previous_hospital}
                        onChange={(e) => updateFormData('previous_hospital', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="korean_doctor">한방주치의</Label>
                      <Input
                        id="korean_doctor"
                        value={formData.korean_doctor}
                        onChange={(e) => updateFormData('korean_doctor', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="western_doctor">양방주치의</Label>
                      <Input
                        id="western_doctor"
                        value={formData.western_doctor}
                        onChange={(e) => updateFormData('western_doctor', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="diet_info">식이</Label>
                    <Input
                      id="diet_info"
                      value={formData.diet_info}
                      onChange={(e) => updateFormData('diet_info', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="counseling_content">상담내용</Label>
                    <Textarea
                      id="counseling_content"
                      value={formData.counseling_content}
                      onChange={(e) => updateFormData('counseling_content', e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="management">
              <Card>
                <CardHeader>
                  <CardTitle>관리 정보</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="chart_number">차트번호</Label>
                      <Input
                        id="chart_number"
                        value={formData.chart_number}
                        onChange={(e) => updateFormData('chart_number', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="manager_name">담당실장</Label>
                      <Input
                        id="manager_name"
                        value={formData.manager_name}
                        onChange={(e) => updateFormData('manager_name', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="insurance_type">실비보험 유형</Label>
                      <Input
                        id="insurance_type"
                        value={formData.insurance_type}
                        onChange={(e) => updateFormData('insurance_type', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthly_avg_days">월 평균 입원/외래 일수</Label>
                      <Input
                        id="monthly_avg_days"
                        type="number"
                        value={formData.monthly_avg_days}
                        onChange={(e) => updateFormData('monthly_avg_days', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="last_visit_date">마지막 내원일</Label>
                      <Input
                        id="last_visit_date"
                        type="date"
                        value={formData.last_visit_date}
                        onChange={(e) => updateFormData('last_visit_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_amount">수납금액(비급여)</Label>
                      <Input
                        id="payment_amount"
                        type="number"
                        value={formData.payment_amount}
                        onChange={(e) => updateFormData('payment_amount', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hospital_treatment">본병원 치료</Label>
                    <Textarea
                      id="hospital_treatment"
                      value={formData.hospital_treatment}
                      onChange={(e) => updateFormData('hospital_treatment', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="examination_schedule">본병원 검사일정</Label>
                    <Textarea
                      id="examination_schedule"
                      value={formData.examination_schedule}
                      onChange={(e) => updateFormData('examination_schedule', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="treatment_plan">광명 면력 치료계획</Label>
                    <Textarea
                      id="treatment_plan"
                      value={formData.treatment_plan}
                      onChange={(e) => updateFormData('treatment_plan', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guardian">
              <Card>
                <CardHeader>
                  <CardTitle>보호자 정보</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guardian_name">보호자명</Label>
                      <Input
                        id="guardian_name"
                        value={formData.guardian_name}
                        onChange={(e) => updateFormData('guardian_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardian_relationship">관계</Label>
                      <Input
                        id="guardian_relationship"
                        value={formData.guardian_relationship}
                        onChange={(e) => updateFormData('guardian_relationship', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guardian_phone">보호자 전화번호</Label>
                      <Input
                        id="guardian_phone"
                        value={formData.guardian_phone}
                        onChange={(e) => updateFormData('guardian_phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact">응급연락처</Label>
                      <Input
                        id="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={(e) => updateFormData('emergency_contact', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : (patient ? '수정' : '등록')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}