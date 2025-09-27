import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, User, FileText, Package, History, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface PatientDetail {
  id: string;
  patient_number: string;
  name: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;  
  first_visit_date?: string;
  visit_type?: string;
  referral_source?: string;
  resident_number_masked?: string;
  admission_date?: string;
  discharge_date?: string;
  assigned_manager: string;
  created_at: string;
  updated_at: string;
}

interface MedicalInfo {
  id: string;
  cancer_type: string;
  cancer_stage?: string;
  primary_doctor?: string;
  diagnosis_date?: string;
  metastasis_status?: boolean;
  metastasis_sites?: string[];
  biopsy_result?: string;
  created_at: string;
  updated_at: string;
}

interface Package {
  id: string;
  package_type: string;
  package_amount: number;
  total_cost: number;
  patient_payment: number;
  outstanding_balance: number;
  insurance_coverage?: number;
  insurance_type?: string;
  has_private_insurance?: boolean;
  start_date: string;
  end_date: string;
  payment_date?: string;
  payment_method?: string;
  created_at: string;
}

interface TreatmentHistory {
  id: string;
  treatment_type: string;
  treatment_name: string;
  start_date?: string;
  end_date?: string;
  hospital_name?: string;
  notes?: string;
  created_at: string;
}

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentHistory[]>([]);

  const fetchPatientData = async () => {
    if (!id) return;
    
    try {
      // 환자 기본 정보
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // 의료 정보
      const { data: medicalData, error: medicalError } = await supabase
        .from('medical_info')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      if (medicalError && medicalError.code !== 'PGRST116') {
        console.error('의료 정보 조회 실패:', medicalError);
      } else {
        setMedicalInfo(medicalData || []);
      }

      // 패키지 정보
      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      if (packageError && packageError.code !== 'PGRST116') {
        console.error('패키지 정보 조회 실패:', packageError);
      } else {
        setPackages(packageData || []);
      }

      // 치료 이력
      const { data: treatmentData, error: treatmentError } = await supabase
        .from('treatment_history')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      if (treatmentError && treatmentError.code !== 'PGRST116') {
        console.error('치료 이력 조회 실패:', treatmentError);
      } else {
        setTreatmentHistory(treatmentData || []);
      }

    } catch (error: any) {
      console.error('환자 정보 조회 실패:', error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "환자 정보를 불러오는데 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patient) return;
    
    if (!window.confirm(`정말로 ${patient.name} 환자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 데이터가 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patient.id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: `${patient.name} 환자가 성공적으로 삭제되었습니다.`,
      });

      navigate('/patients');
    } catch (error: any) {
      console.error('환자 삭제 실패:', error);
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: "환자 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const getVisitTypeBadge = (visitType?: string) => {
    if (!visitType) return null;
    
    const variants = {
      '입원': 'destructive',
      '외래': 'secondary',
      '응급': 'default'
    } as const;

    return (
      <Badge variant={variants[visitType as keyof typeof variants] || 'outline'}>
        {visitType}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg">환자 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">환자를 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/patients')}>환자 목록으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-4">
            <User className="w-8 h-8 text-primary" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{patient.name}</h1>
                {getVisitTypeBadge(patient.visit_type)}
              </div>
              <p className="text-muted-foreground">
                환자번호: {patient.patient_number}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          정보 수정
        </Button>
        <Button 
          variant="destructive" 
          onClick={() => handleDeletePatient()}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          환자 삭제
        </Button>
      </div>

      {/* 기본 정보 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Calendar className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-muted-foreground">첫 방문일</p>
              <p className="font-semibold">
                {patient.first_visit_date ? 
                  format(new Date(patient.first_visit_date), 'yyyy-MM-dd') : 
                  '미등록'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Package className="w-6 h-6 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground">패키지 수</p>
              <p className="font-semibold">{packages.length}개</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <History className="w-6 h-6 mx-auto text-orange-500 mb-2" />
              <p className="text-sm text-muted-foreground">치료 이력</p>
              <p className="font-semibold">{treatmentHistory.length}건</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <FileText className="w-6 h-6 mx-auto text-purple-500 mb-2" />
              <p className="text-sm text-muted-foreground">총 미납액</p>
              <p className="font-semibold text-destructive">
                {packages.reduce((sum, pkg) => sum + (pkg.outstanding_balance || 0), 0).toLocaleString()}원
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 정보 탭 */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="medical">의료 정보</TabsTrigger>
          <TabsTrigger value="packages">패키지</TabsTrigger>
          <TabsTrigger value="treatment">치료 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>개인 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">나이</p>
                    <p className="font-medium">{patient.age || '미등록'}세</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">성별</p>
                    <p className="font-medium">{patient.gender || '미등록'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">연락처</p>
                  <p className="font-medium">{patient.phone || '미등록'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">응급연락처</p>
                  <p className="font-medium">{patient.emergency_contact || '미등록'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">주소</p>
                  <p className="font-medium">{patient.address || '미등록'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>보호자 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">보호자명</p>
                  <p className="font-medium">{patient.guardian_name || '미등록'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">관계</p>
                  <p className="font-medium">{patient.guardian_relationship || '미등록'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">연락처</p>
                  <p className="font-medium">{patient.guardian_phone || '미등록'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>입원/방문 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">입원일</p>
                  <p className="font-medium">
                    {patient.admission_date ? 
                      format(new Date(patient.admission_date), 'yyyy-MM-dd') : 
                      '미등록'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">퇴원일</p>
                  <p className="font-medium">
                    {patient.discharge_date ? 
                      format(new Date(patient.discharge_date), 'yyyy-MM-dd') : 
                      '미퇴원'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">의뢰기관</p>
                  <p className="font-medium">{patient.referral_source || '미등록'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="medical">
          <div className="space-y-4">
            {medicalInfo.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">등록된 의료 정보가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              medicalInfo.map((info) => (
                <Card key={info.id}>
                  <CardHeader>
                    <CardTitle>의료 정보</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      등록일: {format(new Date(info.created_at), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">암 종류</p>
                        <p className="font-medium">{info.cancer_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">병기</p>
                        <p className="font-medium">{info.cancer_stage || '미등록'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">주치의</p>
                        <p className="font-medium">{info.primary_doctor || '미등록'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">진단일</p>
                        <p className="font-medium">
                          {info.diagnosis_date ? 
                            format(new Date(info.diagnosis_date), 'yyyy-MM-dd') : 
                            '미등록'
                          }
                        </p>
                      </div>
                    </div>
                    {info.biopsy_result && (
                      <div>
                        <p className="text-sm text-muted-foreground">조직검사 결과</p>
                        <p className="font-medium">{info.biopsy_result}</p>
                      </div>
                    )}
                    {info.metastasis_sites && info.metastasis_sites.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">전이 부위</p>
                        <p className="font-medium">{info.metastasis_sites.join(', ')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="packages">
          <div className="space-y-4">
            {packages.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">등록된 패키지가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              packages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{pkg.package_type}</span>
                      <Badge variant={pkg.outstanding_balance > 0 ? "destructive" : "secondary"}>
                        {pkg.outstanding_balance > 0 ? "미납" : "완납"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">총 비용</p>
                        <p className="font-medium">{pkg.total_cost.toLocaleString()}원</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">환자 부담금</p>
                        <p className="font-medium">{pkg.patient_payment.toLocaleString()}원</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">미납액</p>
                        <p className="font-medium text-destructive">{pkg.outstanding_balance.toLocaleString()}원</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">시작일</p>
                        <p className="font-medium">{format(new Date(pkg.start_date), 'yyyy-MM-dd')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">종료일</p>
                        <p className="font-medium">{format(new Date(pkg.end_date), 'yyyy-MM-dd')}</p>
                      </div>
                    </div>
                    {pkg.insurance_type && (
                      <div>
                        <p className="text-sm text-muted-foreground">보험 종류</p>
                        <p className="font-medium">{pkg.insurance_type}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="treatment">
          <div className="space-y-4">
            {treatmentHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">등록된 치료 이력이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              treatmentHistory.map((treatment) => (
                <Card key={treatment.id}>
                  <CardHeader>
                    <CardTitle>{treatment.treatment_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {treatment.treatment_type} | {treatment.hospital_name || '본원'}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">시작일</p>
                        <p className="font-medium">
                          {treatment.start_date ? 
                            format(new Date(treatment.start_date), 'yyyy-MM-dd') : 
                            '미등록'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">종료일</p>
                        <p className="font-medium">
                          {treatment.end_date ? 
                            format(new Date(treatment.end_date), 'yyyy-MM-dd') : 
                            '진행중'
                          }
                        </p>
                      </div>
                    </div>
                    {treatment.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">비고</p>
                        <p className="font-medium">{treatment.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}