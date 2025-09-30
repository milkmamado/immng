import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PatientBasicFormProps {
  patient?: any;
  onClose: () => void;
}

export function PatientBasicForm({ patient, onClose }: PatientBasicFormProps) {
  const [formData, setFormData] = useState({
    chart_number: '',           // 차트 번호
    inflow_status: '유입',      // 유입/실패
    visit_type: '',             // 입원/외래(통원)
    visit_motivation: '',       // 내원동기
    name: '',                   // 이름
    diagnosis: '',              // 진단명
    detailed_diagnosis: '',     // 세부진단명
    counselor: '',              // 환자 or 보호자
    previous_hospital: '',      // 이전병원(본원)
    diet_info: '',              // 식이
    korean_doctor: '',          // 한방주치의
    manager_name: '',           // 담당자(상담실장)
    western_doctor: '',         // 양방주치의
    counseling_content: '',     // 상담내용
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (patient) {
      setFormData({
        chart_number: patient.chart_number || '',
        inflow_status: patient.inflow_status || '유입',
        visit_type: patient.visit_type || '',
        visit_motivation: patient.visit_motivation || '',
        name: patient.name || '',
        diagnosis: patient.diagnosis || '',
        detailed_diagnosis: patient.detailed_diagnosis || '',
        counselor: patient.counselor || '',
        previous_hospital: patient.previous_hospital || '',
        diet_info: patient.diet_info || '',
        korean_doctor: patient.korean_doctor || '',
        manager_name: patient.manager_name || '',
        western_doctor: patient.western_doctor || '',
        counseling_content: patient.counseling_content || ''
      });
    }
  }, [patient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const patientData: any = {
        chart_number: formData.chart_number || null,
        inflow_status: formData.inflow_status,
        visit_type: formData.visit_type || null,
        visit_motivation: formData.visit_motivation || null,
        name: formData.name,
        diagnosis: formData.diagnosis || null,
        detailed_diagnosis: formData.detailed_diagnosis || null,
        counselor: formData.counselor || null,
        previous_hospital: formData.previous_hospital || null,
        diet_info: formData.diet_info || null,
        korean_doctor: formData.korean_doctor || null,
        manager_name: formData.manager_name || null,
        western_doctor: formData.western_doctor || null,
        counseling_content: formData.counseling_content || null,
        assigned_manager: user.id
      };

      if (!patient) {
        // 새 환자 등록 시 자동으로 환자번호 생성
        const { data: generatedData, error: generateError } = await supabase
          .rpc('generate_patient_number');
        
        if (generateError) throw generateError;
        
        patientData.patient_number = generatedData;
      }

      if (patient) {
        const { error } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', patient.id);

        if (error) throw error;

        toast({
          title: "수정 완료",
          description: "환자 정보가 성공적으로 수정되었습니다.",
        });
      } else {
        const { error } = await supabase
          .from('patients')
          .insert([patientData]);

        if (error) throw error;

        toast({
          title: "등록 완료",
          description: "새 환자가 성공적으로 등록되었습니다.",
        });
      }

      // 폼 초기화
      setFormData({
        chart_number: '',
        inflow_status: '유입',
        visit_type: '',
        visit_motivation: '',
        name: '',
        diagnosis: '',
        detailed_diagnosis: '',
        counselor: '',
        previous_hospital: '',
        diet_info: '',
        korean_doctor: '',
        manager_name: '',
        western_doctor: '',
        counseling_content: ''
      });

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 차트 번호 */}
        <div>
          <Label htmlFor="chart_number">차트 번호</Label>
          <Input
            id="chart_number"
            name="chart_number"
            value={formData.chart_number}
            onChange={handleInputChange}
            placeholder="차트 번호"
          />
        </div>

        {/* 유입/실패 */}
        <div>
          <Label htmlFor="inflow_status">유입/실패</Label>
          <Select name="inflow_status" value={formData.inflow_status} onValueChange={(value) => handleSelectChange('inflow_status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="유입">유입</SelectItem>
              <SelectItem value="실패">실패</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 입원/외래 */}
        <div>
          <Label htmlFor="visit_type">입원/외래</Label>
          <Select name="visit_type" value={formData.visit_type} onValueChange={(value) => handleSelectChange('visit_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="입원">입원</SelectItem>
              <SelectItem value="외래">외래</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 내원동기 */}
        <div className="md:col-span-2 lg:col-span-3">
          <Label htmlFor="visit_motivation">내원동기</Label>
          <Textarea
            id="visit_motivation"
            name="visit_motivation"
            value={formData.visit_motivation}
            onChange={handleInputChange}
            placeholder="내원동기"
            rows={2}
          />
        </div>

        {/* 이름 */}
        <div>
          <Label htmlFor="name">이름 *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="환자명"
          />
        </div>

        {/* 진단명 */}
        <div>
          <Label htmlFor="diagnosis">진단명</Label>
          <Input
            id="diagnosis"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleInputChange}
            placeholder="진단명"
          />
        </div>

        {/* 세부진단명 */}
        <div className="md:col-span-2 lg:col-span-1">
          <Label htmlFor="detailed_diagnosis">세부진단명</Label>
          <Input
            id="detailed_diagnosis"
            name="detailed_diagnosis"
            value={formData.detailed_diagnosis}
            onChange={handleInputChange}
            placeholder="세부진단명"
          />
        </div>

        {/* 환자 or 보호자 */}
        <div>
          <Label htmlFor="counselor">환자 or 보호자</Label>
          <Input
            id="counselor"
            name="counselor"
            value={formData.counselor}
            onChange={handleInputChange}
            placeholder="환자 or 보호자"
          />
        </div>

        {/* 이전병원(본원) */}
        <div>
          <Label htmlFor="previous_hospital">이전병원(본원)</Label>
          <Input
            id="previous_hospital"
            name="previous_hospital"
            value={formData.previous_hospital}
            onChange={handleInputChange}
            placeholder="이전병원"
          />
        </div>

        {/* 식이 */}
        <div>
          <Label htmlFor="diet_info">식이</Label>
          <Input
            id="diet_info"
            name="diet_info"
            value={formData.diet_info}
            onChange={handleInputChange}
            placeholder="식이 정보"
          />
        </div>

        {/* 한방주치의 */}
        <div>
          <Label htmlFor="korean_doctor">한방주치의</Label>
          <Input
            id="korean_doctor"
            name="korean_doctor"
            value={formData.korean_doctor}
            onChange={handleInputChange}
            placeholder="한방주치의"
          />
        </div>

        {/* 담당자(상담실장) */}
        <div>
          <Label htmlFor="manager_name">담당자(상담실장)</Label>
          <Input
            id="manager_name"
            name="manager_name"
            value={formData.manager_name}
            onChange={handleInputChange}
            placeholder="담당자(상담실장)"
          />
        </div>

        {/* 양방주치의 */}
        <div>
          <Label htmlFor="western_doctor">양방주치의</Label>
          <Input
            id="western_doctor"
            name="western_doctor"
            value={formData.western_doctor}
            onChange={handleInputChange}
            placeholder="양방주치의"
          />
        </div>

        {/* 상담내용 */}
        <div className="md:col-span-2 lg:col-span-3">
          <Label htmlFor="counseling_content">상담내용</Label>
          <Textarea
            id="counseling_content"
            name="counseling_content"
            value={formData.counseling_content}
            onChange={handleInputChange}
            placeholder="상담내용"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "저장 중..." : patient ? "수정" : "등록"}
        </Button>
      </div>
    </form>
  );
}