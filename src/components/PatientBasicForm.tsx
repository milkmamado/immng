import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

interface PatientBasicFormProps {
  patient?: any;
  onClose: () => void;
  initialData?: any;
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
    diagnosis_category: '',     // 진단명 대분류 (API)
    diagnosis_detail: '',       // 진단명 중분류 (API)
    hospital_category: '',      // 이전병원 대분류 (API)
    hospital_branch: '',        // 이전병원 중분류 (API)
    address: '',                // 주소 (API)
    crm_memo: '',               // CRM메모 (API)
    special_note_1: '',         // 특이사항1 (API)
    special_note_2: '',         // 특이사항2 (API)
    treatment_memo_1: '',       // 진료메모1 (API)
    treatment_memo_2: '',       // 진료메모2 (API)
    
    // 수동 입력 필드
    patient_or_guardian: '환자', // 환자 or 보호자
    diet_info: '',              // 식이
    inflow_status: '유입',      // 유입/실패
    visit_type: '',             // 입원/외래
    guardian_name: '',          // 보호자 이름
    guardian_relationship: '', // 보호자 관계
    guardian_phone: '',         // 보호자 연락처
    manager_name: '',           // 담당자(상담실장)
    korean_doctor: '',          // 한방주치의
    western_doctor: '',         // 양방주치의
  });

  const [loading, setLoading] = useState(false);
  const [diagnosisCategoryOptions, setDiagnosisCategoryOptions] = useState<Option[]>([]);
  const [diagnosisDetailOptions, setDiagnosisDetailOptions] = useState<Option[]>([]);
  const [hospitalCategoryOptions, setHospitalCategoryOptions] = useState<Option[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOptions();

    // postMessage로 CRM 데이터 수신
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'crm-patient-data' && event.data?.data) {
        handleCRMDataReceived(event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 환자 데이터 로드 및 설정
  useEffect(() => {
    if (patient) {
      // 대분류 옵션이 로드될 때까지 대기
      if (diagnosisCategoryOptions.length === 0 || hospitalCategoryOptions.length === 0) {
        return;
      }

      setFormData({
        name: patient.name || '',
        customer_number: patient.customer_number || '',
        resident_number_masked: patient.resident_number_masked || '',
        phone: patient.phone || '',
        gender: patient.gender || '',
        age: patient.age?.toString() || '',
        visit_motivation: patient.visit_motivation || '',
        diagnosis_category: patient.diagnosis_category || '',
        diagnosis_detail: patient.diagnosis_detail || '',
        hospital_category: patient.hospital_category || '',
        hospital_branch: patient.hospital_branch || '',
        address: patient.address || '',
        crm_memo: patient.crm_memo || '',
        special_note_1: patient.special_note_1 || '',
        special_note_2: patient.special_note_2 || '',
        treatment_memo_1: patient.treatment_memo_1 || '',
        treatment_memo_2: patient.treatment_memo_2 || '',
        patient_or_guardian: patient.patient_or_guardian || '환자',
        diet_info: patient.diet_info || '',
        inflow_status: patient.inflow_status || '유입',
        visit_type: patient.visit_type || '',
        guardian_name: patient.guardian_name || '',
        guardian_relationship: patient.guardian_relationship || '',
        guardian_phone: patient.guardian_phone || '',
        manager_name: patient.manager_name || '',
        korean_doctor: patient.korean_doctor || '',
        western_doctor: patient.western_doctor || ''
      });
      
      // 진단명 대분류가 있으면 중분류 옵션 로드
      if (patient.diagnosis_category) {
        const parentOption = diagnosisCategoryOptions.find(opt => opt.name === patient.diagnosis_category);
        if (parentOption) {
          supabase
            .from('diagnosis_options')
            .select('*')
            .eq('parent_id', parentOption.id)
            .order('name')
            .then(({ data }) => {
              if (data) {
                setDiagnosisDetailOptions(data);
              }
            });
        }
      }
      
      // manager_name이 없으면 현재 사용자 이름 가져오기
      if (!patient.manager_name) {
        fetchCurrentUserName();
      }
    } else if (initialData) {
      // 조회 다이얼로그에서 넘어온 초기 데이터 설정
      fetchCurrentUserName();
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // manager_name은 현재 사용자로 덮어쓰기 위해 제외
        manager_name: prev.manager_name
      }));
      
      // 초기 데이터에 진단명 대분류가 있으면 중분류 옵션 로드
      if (initialData.diagnosis_category) {
        const parentOption = diagnosisCategoryOptions.find(opt => opt.name === initialData.diagnosis_category);
        if (parentOption) {
          supabase
            .from('diagnosis_options')
            .select('*')
            .eq('parent_id', parentOption.id)
            .order('name')
            .then(({ data }) => {
              if (data) {
                setDiagnosisDetailOptions(data);
              }
            });
        }
      }
    } else {
      fetchCurrentUserName();
    }
  }, [patient, initialData, diagnosisCategoryOptions, hospitalCategoryOptions]);

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
          setFormData(prev => ({
            ...prev,
            manager_name: profile.name
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchOptions = async () => {
    try {
      // 대분류만 가져오기 (parent_id가 null인 것)
      const [diagnosisCategories, hospitalCategories] = await Promise.all([
        supabase.from('diagnosis_options').select('*').is('parent_id', null).order('name'),
        supabase.from('hospital_options').select('*').is('parent_id', null).order('name')
      ]);

      if (diagnosisCategories.data) setDiagnosisCategoryOptions(diagnosisCategories.data);
      if (hospitalCategories.data) setHospitalCategoryOptions(hospitalCategories.data);
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

  const handleSelectChange = async (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 진단명 대분류 변경 시 중분류 옵션 로드
    if (name === 'diagnosis_category') {
      if (value) {
        const parentOption = diagnosisCategoryOptions.find(opt => opt.name === value);
        if (parentOption) {
          const { data } = await supabase
            .from('diagnosis_options')
            .select('*')
            .eq('parent_id', parentOption.id)
            .order('name');
          
          if (data) {
            setDiagnosisDetailOptions(data);
          }
        }
      } else {
        setDiagnosisDetailOptions([]);
      }
      // 대분류 변경 시 중분류 초기화
      setFormData(prev => ({
        ...prev,
        diagnosis_detail: ''
      }));
    }
  };

  const handleSyncCRM = () => {
    if (!patient?.customer_number) {
      toast({
        title: "오류",
        description: "고객번호가 없어 CRM 정보를 가져올 수 없습니다.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    setSyncing(true);

    // 업데이트 모드 플래그 설정 (새 환자 등록과 구분)
    localStorage.setItem('crm_update_mode', patient.id);

    const searchData = {
      name: patient.name,
      phone: patient.phone || '',
      appUrl: window.location.origin + '/first-visit'
    };

    const encoded = btoa(encodeURIComponent(JSON.stringify(searchData)));
    const crmUrl = `http://192.168.1.101/html/MEDI20/main.html#crm_data=${encoded}`;

    window.open(crmUrl, '_blank');

    // 30초 타임아웃
    setTimeout(() => {
      if (syncing) {
        setSyncing(false);
        localStorage.removeItem('crm_update_mode');
        toast({
          title: "타임아웃",
          description: "CRM 데이터를 받지 못했습니다. 다시 시도해주세요.",
          variant: "destructive",
          duration: 2000,
        });
      }
    }, 30000);
  };

  const handleCRMDataReceived = async (crmData: any) => {
    // 업데이트 모드 확인
    const updatePatientId = localStorage.getItem('crm_update_mode');
    
    // 업데이트 모드가 아니거나 현재 환자가 아니면 무시
    if (!updatePatientId || !patient || updatePatientId !== patient.id) {
      return;
    }

    setSyncing(false);
    localStorage.removeItem('crm_update_mode');

    try {
      // 변경된 필드만 추출
      const updatedFields: any = {};
      const apiFields = [
        'name', 'customer_number', 'resident_number_masked', 'phone', 
        'gender', 'age', 'visit_motivation', 'diagnosis_category', 
        'diagnosis_detail', 'hospital_category', 'hospital_branch', 
        'address', 'crm_memo', 'special_note_1', 'special_note_2', 
        'treatment_memo_1', 'treatment_memo_2'
      ];

      apiFields.forEach(field => {
        const crmValue = crmData[field];
        const currentValue = patient[field as keyof typeof patient];
        
        // 값이 다르면 업데이트 대상에 추가
        if (crmValue !== undefined && crmValue !== null && crmValue !== currentValue) {
          if (field === 'age' && crmValue) {
            updatedFields[field] = parseInt(crmValue);
          } else {
            updatedFields[field] = crmValue;
          }
        }
      });

      if (Object.keys(updatedFields).length === 0) {
        toast({
          title: "최신 상태",
          description: "변경된 정보가 없습니다.",
          duration: 2000,
        });
        return;
      }

      // 진단명 대분류가 업데이트되는 경우 중분류 옵션 로드
      if (updatedFields.diagnosis_category) {
        console.log('🔍 CRM 진단명 대분류:', updatedFields.diagnosis_category);
        console.log('🔍 CRM 진단명 중분류:', updatedFields.diagnosis_detail);
        
        const parentOption = diagnosisCategoryOptions.find(
          opt => opt.name === updatedFields.diagnosis_category
        );
        console.log('🔍 찾은 대분류 옵션:', parentOption);
        
        if (parentOption) {
          const { data } = await supabase
            .from('diagnosis_options')
            .select('*')
            .eq('parent_id', parentOption.id)
            .order('name');
          
          console.log('🔍 로드된 중분류 옵션들:', data);
          
          if (data) {
            setDiagnosisDetailOptions(data);
          }
        }
      } else if (updatedFields.diagnosis_detail && !updatedFields.diagnosis_category) {
        // 중분류만 업데이트되는 경우 (대분류는 그대로)
        console.log('🔍 기존 대분류 유지, 중분류만 업데이트:', updatedFields.diagnosis_detail);
        
        const currentCategory = crmData.diagnosis_category || patient.diagnosis_category;
        console.log('🔍 현재 대분류:', currentCategory);
        
        if (currentCategory) {
          const parentOption = diagnosisCategoryOptions.find(
            opt => opt.name === currentCategory
          );
          
          if (parentOption) {
            const { data } = await supabase
              .from('diagnosis_options')
              .select('*')
              .eq('parent_id', parentOption.id)
              .order('name');
            
            console.log('🔍 로드된 중분류 옵션들:', data);
            
            if (data) {
              setDiagnosisDetailOptions(data);
            }
          }
        }
      }

      // DB 업데이트
      const { error } = await supabase
        .from('patients')
        .update(updatedFields)
        .eq('id', patient.id);

      if (error) throw error;

      // 폼 데이터 업데이트
      setFormData(prev => ({
        ...prev,
        ...updatedFields
      }));

      toast({
        title: "최신화 완료",
        description: `${Object.keys(updatedFields).length}개 필드가 업데이트되었습니다.`,
        duration: 2000,
      });

    } catch (error) {
      console.error('Error updating patient data:', error);
      toast({
        title: "오류",
        description: "환자 정보 업데이트에 실패했습니다.",
        variant: "destructive",
        duration: 2000,
      });
    }
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
        diagnosis_category: formData.diagnosis_category || null,
        diagnosis_detail: formData.diagnosis_detail || null,
        hospital_category: formData.hospital_category || null,
        hospital_branch: formData.hospital_branch || null,
        address: formData.address || null,
        crm_memo: formData.crm_memo || null,
        special_note_1: formData.special_note_1 || null,
        special_note_2: formData.special_note_2 || null,
        treatment_memo_1: formData.treatment_memo_1 || null,
        treatment_memo_2: formData.treatment_memo_2 || null,
        patient_or_guardian: formData.patient_or_guardian || null,
        diet_info: formData.diet_info || null,
        inflow_status: formData.inflow_status,
        visit_type: formData.visit_type || null,
        guardian_name: formData.guardian_name || null,
        guardian_relationship: formData.guardian_relationship || null,
        guardian_phone: formData.guardian_phone || null,
        manager_name: formData.manager_name || null,
        korean_doctor: formData.korean_doctor || null,
        western_doctor: formData.western_doctor || null,
        assigned_manager: user.id
      };

      if (patient) {
        const { error } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', patient.id);

        if (error) throw error;

        toast({
          title: "수정 완료",
          description: "환자 정보가 성공적으로 수정되었습니다.",
          duration: 1000,
        });
      } else {
        const { error } = await supabase
          .from('patients')
          .insert([patientData]);

        if (error) throw error;

        toast({
          title: "등록 완료",
          description: "새 환자가 성공적으로 등록되었습니다.",
          duration: 1000,
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
        diagnosis_category: '',
        diagnosis_detail: '',
        hospital_category: '',
        hospital_branch: '',
        address: '',
        crm_memo: '',
        special_note_1: '',
        special_note_2: '',
        treatment_memo_1: '',
        treatment_memo_2: '',
        patient_or_guardian: '환자',
        diet_info: '',
        inflow_status: '유입',
        visit_type: '',
        guardian_name: '',
        guardian_relationship: '',
        guardian_phone: '',
        manager_name: '',
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
        duration: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* API 자동입력 정보 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">API 자동입력 정보</h3>
            <Badge variant="secondary">자동</Badge>
          </div>
          {patient && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncCRM}
              disabled={syncing || !patient.customer_number}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? '최신화 중...' : '기본 정보 최신화'}
            </Button>
          )}
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
              placeholder="API에서 자동 입력"
              disabled
              className="bg-muted"
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
              disabled
              className="bg-muted"
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
          <div>
            <Label htmlFor="visit_motivation">내원동기</Label>
            <Input
              id="visit_motivation"
              name="visit_motivation"
              value={formData.visit_motivation}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력 (블로그, 힐링미, 홈페이지 등)"
              disabled
              className="bg-muted"
            />
          </div>

          {/* 진단명 대분류 */}
          <div>
            <Label htmlFor="diagnosis_category">진단명 (대분류)</Label>
            <Select 
              name="diagnosis_category" 
              value={formData.diagnosis_category} 
              onValueChange={(value) => handleSelectChange('diagnosis_category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {diagnosisCategoryOptions.map(option => (
                  <SelectItem key={option.id} value={option.name}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 진단명 중분류 */}
          <div>
            <Label htmlFor="diagnosis_detail">진단명 (중분류)</Label>
            <Select 
              name="diagnosis_detail" 
              value={formData.diagnosis_detail} 
              onValueChange={(value) => handleSelectChange('diagnosis_detail', value)}
              disabled={!formData.diagnosis_category || diagnosisDetailOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.diagnosis_category ? "선택" : "대분류 먼저 선택"} />
              </SelectTrigger>
              <SelectContent>
                {diagnosisDetailOptions.map(option => (
                  <SelectItem key={option.id} value={option.name}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 이전병원 대분류 */}
          <div>
            <Label htmlFor="hospital_category">이전병원 (대분류)</Label>
            <Input
              id="hospital_category"
              name="hospital_category"
              value={formData.hospital_category}
              placeholder="API에서 자동 입력"
              disabled
              className="bg-muted"
            />
          </div>

          {/* 이전병원 중분류 */}
          <div>
            <Label htmlFor="hospital_branch">이전병원 (중분류)</Label>
            <Input
              id="hospital_branch"
              name="hospital_branch"
              value={formData.hospital_branch}
              placeholder="API에서 자동 입력"
              disabled
              className="bg-muted"
            />
          </div>

          {/* 주소 */}
          <div className="md:col-span-2 lg:col-span-3">
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

          {/* 특이사항1 */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="special_note_1">특이사항1</Label>
            <Textarea
              id="special_note_1"
              name="special_note_1"
              value={formData.special_note_1}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              rows={3}
              disabled
              className="bg-muted"
            />
          </div>

          {/* 특이사항2 */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="special_note_2">특이사항2</Label>
            <Textarea
              id="special_note_2"
              name="special_note_2"
              value={formData.special_note_2}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              rows={3}
              disabled
              className="bg-muted"
            />
          </div>

          {/* 진료메모1 */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="treatment_memo_1">진료메모1</Label>
            <Textarea
              id="treatment_memo_1"
              name="treatment_memo_1"
              value={formData.treatment_memo_1}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              rows={3}
              disabled
              className="bg-muted"
            />
          </div>

          {/* 진료메모2 */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="treatment_memo_2">진료메모2</Label>
            <Textarea
              id="treatment_memo_2"
              name="treatment_memo_2"
              value={formData.treatment_memo_2}
              onChange={handleInputChange}
              placeholder="API에서 자동 입력"
              rows={3}
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
          {/* 환자 or 보호자 */}
          <div>
            <Label htmlFor="patient_or_guardian">환자 or 보호자</Label>
            <Select name="patient_or_guardian" value={formData.patient_or_guardian} onValueChange={(value) => handleSelectChange('patient_or_guardian', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
              placeholder="식이정보"
            />
          </div>

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
              placeholder="자동입력"
              disabled
              className="bg-muted"
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