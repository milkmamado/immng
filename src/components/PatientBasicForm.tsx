import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PatientBasicFormProps {
  patient?: any;
  onClose: () => void;
  initialData?: { name: string; phone: string } | null;
}

interface Option {
  id: string;
  name: string;
}

export function PatientBasicForm({ patient, onClose, initialData }: PatientBasicFormProps) {
  const [formData, setFormData] = useState({
    // API 자동입력 필드
    name: '',                   // 고객명 (API)
    customer_number: '',        // 고객번호 (API)
    resident_number_masked: '', // 주민번호 (API)
    phone: '',                  // 휴대폰번호 (API)
    gender: '',                 // 성별 (API)
    age: '',                    // 나이(만) (API)
    visit_motivation: '',       // 내원동기 (API)
    diagnosis: '',              // 진단명 (API)
    previous_hospital: '',      // 이전병원코드 (API)
    address: '',                // 주소 (API)
    crm_memo: '',               // CRM메모 (API)
    
    // 수동 입력 필드
    inflow_status: '유입',      // 유입/실패
    first_visit_date: '',       // 초진일자
    visit_type: '',             // 입원/외래
    referral_source: '',        // 의뢰처
    guardian_name: '',          // 보호자 이름
    guardian_relationship: '', // 보호자 관계
    guardian_phone: '',         // 보호자 연락처
    manager_name: '',           // 담당자(상담실장)
    memo1: '',                  // 메모1
    memo2: '',                  // 메모2
    
    // 기타 필드 (기존 유지)
    birth_date: '',
    detailed_diagnosis: '',
    counselor: '',
    diet_info: '',
    korean_doctor: '',
    western_doctor: '',
  });

  const [loading, setLoading] = useState(false);
  const [diagnosisOptions, setDiagnosisOptions] = useState<Option[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<Option[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        customer_number: patient.customer_number || '',
        resident_number_masked: patient.resident_number_masked || '',
        phone: patient.phone || '',
        gender: patient.gender || '',
        age: patient.age?.toString() || '',
        visit_motivation: patient.visit_motivation || '',
        diagnosis: patient.diagnosis || '',
        previous_hospital: patient.previous_hospital || '',
        address: patient.address || '',
        crm_memo: patient.crm_memo || '',
        inflow_status: patient.inflow_status || '유입',
        first_visit_date: patient.first_visit_date || '',
        visit_type: patient.visit_type || '',
        referral_source: patient.referral_source || '',
        guardian_name: patient.guardian_name || '',
        guardian_relationship: patient.guardian_relationship || '',
        guardian_phone: patient.guardian_phone || '',
        manager_name: patient.manager_name || '',
        memo1: patient.memo1 || '',
        memo2: patient.memo2 || '',
        birth_date: patient.birth_date || '',
        detailed_diagnosis: patient.detailed_diagnosis || '',
        counselor: patient.counselor || '',
        diet_info: patient.diet_info || '',
        korean_doctor: patient.korean_doctor || '',
        western_doctor: patient.western_doctor || ''
      });
    } else if (initialData) {
      // 조회 다이얼로그에서 넘어온 초기 데이터 설정
      setFormData(prev => ({
        ...prev,
        name: initialData.name,
        phone: initialData.phone
      }));
    }
  }, [patient, initialData]);

  const fetchOptions = async () => {
    try {
      const [diagnosis, hospital] = await Promise.all([
        (supabase as any).from('diagnosis_options').select('*').order('name'),
        (supabase as any).from('hospital_options').select('*').order('name')
      ]);

      if (diagnosis.data) setDiagnosisOptions(diagnosis.data);
      if (hospital.data) setHospitalOptions(hospital.data);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 전화번호 포맷팅
    if (name === 'phone') {
      const numbers = value.replace(/[^0-9]/g, '');
      let formattedPhone = numbers;
      
      if (numbers.length <= 3) {
        formattedPhone = numbers;
      } else if (numbers.length <= 7) {
        formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length <= 11) {
        formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
      } else {
        formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }
      
      setFormData(prev => ({
        ...prev,
        phone: formattedPhone
      }));
      return;
    }
    
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
        name: formData.name,
        customer_number: formData.customer_number || null,
        resident_number_masked: formData.resident_number_masked || null,
        phone: formData.phone || null,
        gender: formData.gender || null,
        age: formData.age ? parseInt(formData.age) : null,
        visit_motivation: formData.visit_motivation || null,
        diagnosis: formData.diagnosis || null,
        previous_hospital: formData.previous_hospital || null,
        address: formData.address || null,
        crm_memo: formData.crm_memo || null,
        inflow_status: formData.inflow_status,
        first_visit_date: formData.first_visit_date || null,
        visit_type: formData.visit_type || null,
        referral_source: formData.referral_source || null,
        guardian_name: formData.guardian_name || null,
        guardian_relationship: formData.guardian_relationship || null,
        guardian_phone: formData.guardian_phone || null,
        manager_name: formData.manager_name || null,
        memo1: formData.memo1 || null,
        memo2: formData.memo2 || null,
        birth_date: formData.birth_date || null,
        detailed_diagnosis: formData.detailed_diagnosis || null,
        counselor: formData.counselor || null,
        diet_info: formData.diet_info || null,
        korean_doctor: formData.korean_doctor || null,
        western_doctor: formData.western_doctor || null,
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
        name: '',
        customer_number: '',
        resident_number_masked: '',
        phone: '',
        gender: '',
        age: '',
        visit_motivation: '',
        diagnosis: '',
        previous_hospital: '',
        address: '',
        crm_memo: '',
        inflow_status: '유입',
        first_visit_date: '',
        visit_type: '',
        referral_source: '',
        guardian_name: '',
        guardian_relationship: '',
        guardian_phone: '',
        manager_name: '',
        memo1: '',
        memo2: '',
        birth_date: '',
        detailed_diagnosis: '',
        counselor: '',
        diet_info: '',
        korean_doctor: '',
        western_doctor: ''
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* API 자동입력 정보 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <h3 className="text-lg font-semibold">API 자동입력 정보</h3>
          <Badge variant="secondary">자동</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 고객명 */}
          <div>
            <Label htmlFor="name">고객명 *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="고객명"
              disabled={!!initialData}
              className={initialData ? "bg-muted" : ""}
            />
          </div>

          {/* 고객번호 */}
          <div>
            <Label htmlFor="customer_number">고객번호</Label>
            <Input
              id="customer_number"
              name="customer_number"
              value={formData.customer_number}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              disabled
              className="bg-muted"
            />
          </div>

          {/* 주민번호 */}
          <div>
            <Label htmlFor="resident_number_masked">주민번호</Label>
            <Input
              id="resident_number_masked"
              name="resident_number_masked"
              value={formData.resident_number_masked}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              disabled
              className="bg-muted"
            />
          </div>

          {/* 휴대폰번호 */}
          <div>
            <Label htmlFor="phone">휴대폰번호</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              disabled={!!initialData}
              className={initialData ? "bg-muted" : ""}
              maxLength={13}
            />
          </div>

          {/* 성별 */}
          <div>
            <Label htmlFor="gender">성별</Label>
            <Input
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              disabled
              className="bg-muted"
            />
          </div>

          {/* 나이(만) */}
          <div>
            <Label htmlFor="age">나이(만)</Label>
            <Input
              id="age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              disabled
              className="bg-muted"
            />
          </div>

          {/* 내원동기 */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="visit_motivation">내원동기</Label>
            <Textarea
              id="visit_motivation"
              name="visit_motivation"
              value={formData.visit_motivation}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              rows={2}
              disabled
              className="bg-muted"
            />
          </div>

          {/* 진단명 */}
          <div>
            <Label htmlFor="diagnosis">진단명</Label>
            <Select 
              value={formData.diagnosis} 
              onValueChange={(value) => handleSelectChange('diagnosis', value)}
              disabled
            >
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder="API에서 자동 입력" />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-background">
                {diagnosisOptions.map(option => (
                  <SelectItem key={option.id} value={option.name}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 이전병원코드 */}
          <div>
            <Label htmlFor="previous_hospital">이전병원코드</Label>
            <Select 
              value={formData.previous_hospital} 
              onValueChange={(value) => handleSelectChange('previous_hospital', value)}
              disabled
            >
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder="API에서 자동 입력" />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-background">
                {hospitalOptions.map(option => (
                  <SelectItem key={option.id} value={option.name}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 주소 */}
          <div className="md:col-span-2 lg:col-span-1">
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              disabled
              className="bg-muted"
            />
          </div>

          {/* CRM메모 */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="crm_memo">CRM메모</Label>
            <Textarea
              id="crm_memo"
              name="crm_memo"
              value={formData.crm_memo}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              rows={3}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      </div>

      {/* 수동 입력 정보 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <h3 className="text-lg font-semibold">추가 입력 정보</h3>
          <Badge variant="outline">수동입력</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 유입/실패 */}
          <div>
            <Label htmlFor="inflow_status">유입상태 *</Label>
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

          {/* 초진일자 */}
          <div>
            <Label htmlFor="first_visit_date">초진일자</Label>
            <Input
              id="first_visit_date"
              name="first_visit_date"
              type="date"
              value={formData.first_visit_date}
              onChange={handleInputChange}
            />
          </div>

          {/* 입원/외래 */}
          <div>
            <Label htmlFor="visit_type">내원형태</Label>
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

          {/* 의뢰처 */}
          <div>
            <Label htmlFor="referral_source">의뢰처</Label>
            <Input
              id="referral_source"
              name="referral_source"
              value={formData.referral_source}
              onChange={handleInputChange}
              placeholder="의뢰처"
            />
          </div>

          {/* 보호자 이름 */}
          <div>
            <Label htmlFor="guardian_name">보호자 이름</Label>
            <Input
              id="guardian_name"
              name="guardian_name"
              value={formData.guardian_name}
              onChange={handleInputChange}
              placeholder="보호자 이름"
            />
          </div>

          {/* 보호자 관계 */}
          <div>
            <Label htmlFor="guardian_relationship">보호자 관계</Label>
            <Input
              id="guardian_relationship"
              name="guardian_relationship"
              value={formData.guardian_relationship}
              onChange={handleInputChange}
              placeholder="보호자 관계"
            />
          </div>

          {/* 보호자 연락처 */}
          <div>
            <Label htmlFor="guardian_phone">보호자 연락처</Label>
            <Input
              id="guardian_phone"
              name="guardian_phone"
              type="tel"
              value={formData.guardian_phone}
              onChange={handleInputChange}
              placeholder="보호자 연락처"
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
              placeholder="담당자"
            />
          </div>

          {/* 생년월일 */}
          <div>
            <Label htmlFor="birth_date">생년월일</Label>
            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleInputChange}
            />
          </div>

          {/* 세부진단명 */}
          <div className="md:col-span-2 lg:col-span-3">
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
            <Select 
              value={formData.counselor} 
              onValueChange={(value) => handleSelectChange('counselor', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-background">
                <SelectItem value="환자">환자</SelectItem>
                <SelectItem value="보호자">보호자</SelectItem>
              </SelectContent>
            </Select>
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

          {/* 메모1 */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="memo1">메모1</Label>
            <Textarea
              id="memo1"
              name="memo1"
              value={formData.memo1}
              onChange={handleInputChange}
              placeholder="메모1"
              rows={2}
            />
          </div>

          {/* 메모2 */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="memo2">메모2</Label>
            <Textarea
              id="memo2"
              name="memo2"
              value={formData.memo2}
              onChange={handleInputChange}
              placeholder="메모2"
              rows={2}
            />
          </div>
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