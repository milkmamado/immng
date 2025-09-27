import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PatientRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [patientData, setPatientData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    emergency_contact: '',
    guardian_name: '',
    guardian_relationship: '',
    guardian_phone: '',
    first_visit_date: '',
    visit_type: '',
    referral_source: '',
    resident_number_masked: '',
    admission_date: '',
    // 의료 정보
    cancer_type: '',
    cancer_stage: '',
    primary_doctor: '',
    diagnosis_date: '',
    metastasis_status: false,
    metastasis_sites: '',
    biopsy_result: ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientData.name.trim()) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "환자명은 필수 항목입니다.",
      });
      return;
    }

    setLoading(true);
    
    try {
      // patient_number 생성
      const { data: patientNumber, error: numberError } = await supabase
        .rpc('generate_patient_number');
      
      if (numberError) throw numberError;

      // 환자 기본 정보 등록
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          patient_number: patientNumber,
          name: patientData.name,
          phone: patientData.phone || null,
          age: patientData.age ? parseInt(patientData.age) : null,
          gender: patientData.gender || null,
          address: patientData.address || null,
          emergency_contact: patientData.emergency_contact || null,
          guardian_name: patientData.guardian_name || null,
          guardian_relationship: patientData.guardian_relationship || null,
          guardian_phone: patientData.guardian_phone || null,
          first_visit_date: patientData.first_visit_date || null,
          visit_type: patientData.visit_type || null,
          referral_source: patientData.referral_source || null,
          resident_number_masked: patientData.resident_number_masked || null,
          admission_date: patientData.admission_date || null,
          assigned_manager: user?.id
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // 의료 정보가 있으면 등록
      if (patientData.cancer_type) {
        const { error: medicalError } = await supabase
          .from('medical_info')
          .insert({
            patient_id: patient.id,
            cancer_type: patientData.cancer_type,
            cancer_stage: patientData.cancer_stage || null,
            primary_doctor: patientData.primary_doctor || null,
            diagnosis_date: patientData.diagnosis_date || null,
            metastasis_status: patientData.metastasis_status,
            metastasis_sites: patientData.metastasis_sites ? [patientData.metastasis_sites] : null,
            biopsy_result: patientData.biopsy_result || null
          });

        if (medicalError) {
          console.error('의료 정보 등록 실패:', medicalError);
          // 의료 정보 실패해도 환자는 등록되었으므로 경고만 표시
          toast({
            variant: "destructive",
            title: "부분 완료",
            description: "환자는 등록되었으나 의료 정보 등록에 실패했습니다.",
          });
        }
      }

      toast({
        title: "등록 완료",
        description: `${patientData.name} 환자가 성공적으로 등록되었습니다.`,
      });

      navigate(`/patients/${patient.id}`);
    } catch (error: any) {
      console.error('환자 등록 실패:', error);
      toast({
        variant: "destructive",
        title: "등록 실패",
        description: "환자 등록 중 오류가 발생했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-4">
          <User className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">신규 환자 등록</h1>
            <p className="text-muted-foreground">
              새로운 환자의 기본 정보와 의료 정보를 등록합니다.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">환자명 *</Label>
                <Input
                  id="name"
                  value={patientData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="예: 김기순"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  value={patientData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="01012345678"
                />
              </div>
              <div>
                <Label htmlFor="age">나이</Label>
                <Input
                  id="age"
                  type="number"
                  value={patientData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="65"
                />
              </div>
              <div>
                <Label htmlFor="gender">성별</Label>
                <Select value={patientData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="성별 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="남성">남성</SelectItem>
                    <SelectItem value="여성">여성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">주소</Label>
              <Textarea
                id="address"
                value={patientData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="서울시 강남구..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact">응급연락처</Label>
                <Input
                  id="emergency_contact"
                  value={patientData.emergency_contact}
                  onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                  placeholder="01087654321"
                />
              </div>
              <div>
                <Label htmlFor="resident_number_masked">주민번호 (뒤자리 마스킹)</Label>
                <Input
                  id="resident_number_masked"
                  value={patientData.resident_number_masked}
                  onChange={(e) => handleInputChange('resident_number_masked', e.target.value)}
                  placeholder="123456-1******"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 보호자 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>보호자 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="guardian_name">보호자명</Label>
                <Input
                  id="guardian_name"
                  value={patientData.guardian_name}
                  onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                  placeholder="김철수"
                />
              </div>
              <div>
                <Label htmlFor="guardian_relationship">관계</Label>
                <Select value={patientData.guardian_relationship} onValueChange={(value) => handleInputChange('guardian_relationship', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="관계 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="배우자">배우자</SelectItem>
                    <SelectItem value="자녀">자녀</SelectItem>
                    <SelectItem value="부모">부모</SelectItem>
                    <SelectItem value="형제자매">형제자매</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="guardian_phone">보호자 연락처</Label>
                <Input
                  id="guardian_phone"
                  value={patientData.guardian_phone}
                  onChange={(e) => handleInputChange('guardian_phone', e.target.value)}
                  placeholder="01098765432"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 입원/방문 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>입원/방문 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="visit_type">방문 유형</Label>
                <Select value={patientData.visit_type} onValueChange={(value) => handleInputChange('visit_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="방문 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="입원">입원</SelectItem>
                    <SelectItem value="외래">외래</SelectItem>
                    <SelectItem value="응급">응급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="first_visit_date">첫 방문일</Label>
                <Input
                  id="first_visit_date"
                  type="date"
                  value={patientData.first_visit_date}
                  onChange={(e) => handleInputChange('first_visit_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="admission_date">입원일</Label>
                <Input
                  id="admission_date"
                  type="date"
                  value={patientData.admission_date}
                  onChange={(e) => handleInputChange('admission_date', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="referral_source">의뢰기관</Label>
              <Input
                id="referral_source"
                value={patientData.referral_source}
                onChange={(e) => handleInputChange('referral_source', e.target.value)}
                placeholder="서울대병원, 직접 방문 등"
              />
            </div>
          </CardContent>
        </Card>

        {/* 의료 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>의료 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cancer_type">암 종류</Label>
                <Input
                  id="cancer_type"
                  value={patientData.cancer_type}
                  onChange={(e) => handleInputChange('cancer_type', e.target.value)}
                  placeholder="폐암, 간암 등"
                />
              </div>
              <div>
                <Label htmlFor="cancer_stage">병기</Label>
                <Select value={patientData.cancer_stage} onValueChange={(value) => handleInputChange('cancer_stage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="병기 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1기">1기</SelectItem>
                    <SelectItem value="2기">2기</SelectItem>
                    <SelectItem value="3기">3기</SelectItem>
                    <SelectItem value="4기">4기</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="primary_doctor">주치의</Label>
                <Input
                  id="primary_doctor"
                  value={patientData.primary_doctor}
                  onChange={(e) => handleInputChange('primary_doctor', e.target.value)}
                  placeholder="김의사"
                />
              </div>
              <div>
                <Label htmlFor="diagnosis_date">진단일</Label>
                <Input
                  id="diagnosis_date"
                  type="date"
                  value={patientData.diagnosis_date}
                  onChange={(e) => handleInputChange('diagnosis_date', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="biopsy_result">조직검사 결과</Label>
              <Textarea
                id="biopsy_result"
                value={patientData.biopsy_result}
                onChange={(e) => handleInputChange('biopsy_result', e.target.value)}
                placeholder="조직검사 결과 내용"
              />
            </div>

            <div>
              <Label htmlFor="metastasis_sites">전이 부위</Label>
              <Input
                id="metastasis_sites"
                value={patientData.metastasis_sites}
                onChange={(e) => handleInputChange('metastasis_sites', e.target.value)}
                placeholder="간, 폐, 뼈 등 (해당시)"
              />
            </div>
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/patients')}
            disabled={loading}
          >
            취소
          </Button>
          <Button type="submit" disabled={loading} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {loading ? '등록 중...' : '환자 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}