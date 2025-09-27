import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, User, FileText, Package, History, Calendar, Trash2, Plus, MessageSquare, CheckCircle, Clock } from 'lucide-react';
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

interface AdmissionCycle {
  id: string;
  cycle_number: number;
  admission_date: string;
  discharge_date?: string;
  status: string;
  admission_type: string;
  discharge_reason?: string;
  created_at: string;
}

interface PatientNote {
  id: string;
  admission_cycle_id?: string;
  note_type: string;
  title?: string;
  content: string;
  is_important: boolean;
  created_by: string;
  created_at: string;
  creator_name?: string;
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
  admission_cycle_id?: string;
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
  admission_cycle_id?: string;
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
  admission_cycle_id?: string;
  created_at: string;
}

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [admissionCycles, setAdmissionCycles] = useState<AdmissionCycle[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentHistory[]>([]);
  
  // 새 입원 등록 모달
  const [showNewAdmissionModal, setShowNewAdmissionModal] = useState(false);
  const [newAdmissionData, setNewAdmissionData] = useState({
    admission_date: '',
    admission_type: '입원'
  });
  
  // 메모 추가 모달
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNoteData, setNewNoteData] = useState({
    admission_cycle_id: '',
    note_type: 'general',
    title: '',
    content: '',
    is_important: false
  });

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

      // 입퇴원 사이클
      const { data: cycleData, error: cycleError } = await supabase
        .from('admission_cycles')
        .select('*')
        .eq('patient_id', id)
        .order('cycle_number', { ascending: false });

      if (cycleError && cycleError.code !== 'PGRST116') {
        console.error('입퇴원 사이클 조회 실패:', cycleError);
      } else {
        setAdmissionCycles(cycleData || []);
      }

      // 환자 메모
      const { data: noteData, error: noteError } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      if (noteError && noteError.code !== 'PGRST116') {
        console.error('환자 메모 조회 실패:', noteError);
      } else {
        const notesWithCreatorNames = (noteData || []).map(note => ({
          ...note,
          creator_name: '관리자'
        }));
        setPatientNotes(notesWithCreatorNames);
      }

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

  const handleNewAdmission = async () => {
    if (!patient || !newAdmissionData.admission_date) return;

    try {
      // 다음 사이클 번호 가져오기
      const { data: nextCycleNumber, error: cycleError } = await supabase
        .rpc('get_next_cycle_number', { patient_uuid: patient.id });

      if (cycleError) throw cycleError;

      // 새 입원 사이클 생성
      const { error: insertError } = await supabase
        .from('admission_cycles')
        .insert({
          patient_id: patient.id,
          cycle_number: nextCycleNumber,
          admission_date: newAdmissionData.admission_date,
          admission_type: newAdmissionData.admission_type,
          status: 'admitted'
        });

      if (insertError) throw insertError;

      toast({
        title: "입원 등록 완료",
        description: `${patient.name} 환자의 ${nextCycleNumber}차 입원이 등록되었습니다.`,
      });

      setShowNewAdmissionModal(false);
      setNewAdmissionData({ admission_date: '', admission_type: '입원' });
      fetchPatientData();
    } catch (error: any) {
      console.error('입원 등록 실패:', error);
      toast({
        variant: "destructive",
        title: "입원 등록 실패",
        description: "입원 등록 중 오류가 발생했습니다.",
      });
    }
  };

  const handleDischarge = async (cycleId: string) => {
    const dischargeDate = window.prompt('퇴원일을 입력하세요 (YYYY-MM-DD 형식):');
    if (!dischargeDate) return;

    const dischargeReason = window.prompt('퇴원 사유를 입력하세요 (선택사항):');

    try {
      const { error } = await supabase
        .from('admission_cycles')
        .update({
          discharge_date: dischargeDate,
          discharge_reason: dischargeReason || null,
          status: 'discharged'
        })
        .eq('id', cycleId);

      if (error) throw error;

      toast({
        title: "퇴원 처리 완료",
        description: "환자가 성공적으로 퇴원 처리되었습니다.",
      });

      fetchPatientData();
    } catch (error: any) {
      console.error('퇴원 처리 실패:', error);
      toast({
        variant: "destructive",
        title: "퇴원 처리 실패",
        description: "퇴원 처리 중 오류가 발생했습니다.",
      });
    }
  };

  const handleAddNote = async () => {
    if (!patient || !newNoteData.content.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('patient_notes')
        .insert({
          patient_id: patient.id,
          admission_cycle_id: newNoteData.admission_cycle_id === "all" ? null : newNoteData.admission_cycle_id,
          note_type: newNoteData.note_type,
          title: newNoteData.title || null,
          content: newNoteData.content,
          is_important: newNoteData.is_important,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "메모 추가 완료",
        description: "새로운 메모가 추가되었습니다.",
      });

      setShowNoteModal(false);
      setNewNoteData({
        admission_cycle_id: '',
        note_type: 'general',
        title: '',
        content: '',
        is_important: false
      });
      fetchPatientData();
    } catch (error: any) {
      console.error('메모 추가 실패:', error);
      toast({
        variant: "destructive",
        title: "메모 추가 실패",
        description: "메모 추가 중 오류가 발생했습니다.",
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

  const getNoteTypeColor = (noteType: string) => {
    const colors = {
      general: 'bg-blue-50 border-blue-200',
      medical: 'bg-red-50 border-red-200',
      financial: 'bg-green-50 border-green-200',
      family: 'bg-purple-50 border-purple-200'
    };
    return colors[noteType as keyof typeof colors] || 'bg-gray-50 border-gray-200';
  };

  const getNoteTypeLabel = (noteType: string) => {
    const labels = {
      general: '일반',
      medical: '의료',
      financial: '재무',
      family: '가족'
    };
    return labels[noteType as keyof typeof labels] || noteType;
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
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          <Dialog open={showNewAdmissionModal} onOpenChange={setShowNewAdmissionModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                새 입원 등록
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 입원 등록</DialogTitle>
                <DialogDescription>
                  {patient.name} 환자의 새로운 입원을 등록합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admission_date">입원일</Label>
                  <Input
                    id="admission_date"
                    type="date"
                    value={newAdmissionData.admission_date}
                    onChange={(e) => setNewAdmissionData({
                      ...newAdmissionData,
                      admission_date: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="admission_type">입원 유형</Label>
                  <Select 
                    value={newAdmissionData.admission_type} 
                    onValueChange={(value) => setNewAdmissionData({
                      ...newAdmissionData,
                      admission_type: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="입원">입원</SelectItem>
                      <SelectItem value="외래">외래</SelectItem>
                      <SelectItem value="응급">응급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewAdmissionModal(false)}>
                    취소
                  </Button>
                  <Button onClick={handleNewAdmission}>
                    등록
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
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
      </div>

      {/* 기본 정보 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Calendar className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-muted-foreground">총 입원 횟수</p>
              <p className="font-semibold">{admissionCycles.length}회</p>
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
              <MessageSquare className="w-6 h-6 mx-auto text-orange-500 mb-2" />
              <p className="text-sm text-muted-foreground">메모/코멘트</p>
              <p className="font-semibold">{patientNotes.length}개</p>
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

      {/* 상세 정보 그리드 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 통합된 기본정보 + 의료정보 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                환자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 개인정보 섹션 */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground">개인 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">나이</p>
                    <p className="font-medium">{patient.age || '미등록'}세</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">성별</p>
                    <p className="font-medium">{patient.gender || '미등록'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">연락처</p>
                    <p className="font-medium">{patient.phone || '미등록'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">응급연락처</p>
                    <p className="font-medium">{patient.emergency_contact || '미등록'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">주소</p>
                  <p className="font-medium">{patient.address || '미등록'}</p>
                </div>
                
                {/* 보호자 정보 */}
                {(patient.guardian_name || patient.guardian_phone) && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">보호자 정보</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {patient.guardian_name && (
                        <div>
                          <p className="text-sm text-muted-foreground">보호자명</p>
                          <p className="font-medium">{patient.guardian_name}</p>
                        </div>
                      )}
                      {patient.guardian_relationship && (
                        <div>
                          <p className="text-sm text-muted-foreground">관계</p>
                          <p className="font-medium">{patient.guardian_relationship}</p>
                        </div>
                      )}
                      {patient.guardian_phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">연락처</p>
                          <p className="font-medium">{patient.guardian_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 의료정보 섹션 */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground">의료 정보</h3>
                {medicalInfo.length === 0 ? (
                  <p className="text-sm text-muted-foreground">등록된 의료 정보가 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {medicalInfo.map((info) => (
                      <div key={info.id} className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
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
                              {info.diagnosis_date ? format(new Date(info.diagnosis_date), 'yyyy-MM-dd') : '미등록'}
                            </p>
                          </div>
                        </div>
                        {info.metastasis_status && (
                          <div>
                            <p className="text-sm text-muted-foreground">전이 여부</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">전이 있음</Badge>
                              {info.metastasis_sites && info.metastasis_sites.length > 0 && (
                                <span className="text-sm">- {info.metastasis_sites.join(', ')}</span>
                              )}
                            </div>
                          </div>
                        )}
                        {info.biopsy_result && (
                          <div>
                            <p className="text-sm text-muted-foreground">조직검사 결과</p>
                            <p className="font-medium">{info.biopsy_result}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 방문 정보 섹션 */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground">방문 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">첫 방문일</p>
                    <p className="font-medium">
                      {patient.first_visit_date ? format(new Date(patient.first_visit_date), 'yyyy-MM-dd') : '미등록'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">방문 유형</p>
                    <div className="flex items-center gap-2">
                      {getVisitTypeBadge(patient.visit_type)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">내원 경로</p>
                    <p className="font-medium">{patient.referral_source || '미등록'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 입퇴원이력, 패키지, 메모/코멘트 */}
        <div className="space-y-6">
          {/* 입퇴원 이력 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  입퇴원 이력
                </CardTitle>
                <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      메모 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>메모 추가</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>입원 사이클 (선택사항)</Label>
                        <Select 
                          value={newNoteData.admission_cycle_id} 
                          onValueChange={(value) => setNewNoteData({
                            ...newNoteData,
                            admission_cycle_id: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="전체 환자 메모" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">전체 환자 메모</SelectItem>
                            {admissionCycles.map((cycle) => (
                              <SelectItem key={cycle.id} value={cycle.id}>
                                {cycle.cycle_number}차 입원 ({format(new Date(cycle.admission_date), 'yyyy-MM-dd')})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>메모 유형</Label>
                        <Select 
                          value={newNoteData.note_type} 
                          onValueChange={(value) => setNewNoteData({
                            ...newNoteData,
                            note_type: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">일반</SelectItem>
                            <SelectItem value="medical">의료</SelectItem>
                            <SelectItem value="financial">재무</SelectItem>
                            <SelectItem value="family">가족</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>제목 (선택사항)</Label>
                        <Input
                          value={newNoteData.title}
                          onChange={(e) => setNewNoteData({
                            ...newNoteData,
                            title: e.target.value
                          })}
                          placeholder="메모 제목"
                        />
                      </div>
                      <div>
                        <Label>내용</Label>
                        <Textarea
                          value={newNoteData.content}
                          onChange={(e) => setNewNoteData({
                            ...newNoteData,
                            content: e.target.value
                          })}
                          placeholder="메모 내용을 입력하세요..."
                          rows={4}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_important"
                          checked={newNoteData.is_important}
                          onChange={(e) => setNewNoteData({
                            ...newNoteData,
                            is_important: e.target.checked
                          })}
                        />
                        <Label htmlFor="is_important">중요 메모로 표시</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowNoteModal(false)}>
                          취소
                        </Button>
                        <Button onClick={handleAddNote}>
                          메모 추가
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {admissionCycles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>등록된 입원 이력이 없습니다.</p>
                  </div>
                ) : (
                  admissionCycles.map((cycle) => (
                    <Card key={cycle.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{cycle.cycle_number}차 입원</h3>
                              <Badge variant={cycle.status === 'admitted' ? 'destructive' : 'secondary'}>
                                {cycle.status === 'admitted' ? '입원중' : '퇴원'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>입원일: {format(new Date(cycle.admission_date), 'yyyy년 MM월 dd일')}</p>
                              {cycle.discharge_date && (
                                <p>퇴원일: {format(new Date(cycle.discharge_date), 'yyyy년 MM월 dd일')}</p>
                              )}
                              {cycle.discharge_reason && (
                                <p>퇴원 사유: {cycle.discharge_reason}</p>
                              )}
                              <p>
                                재원 기간: {
                                  cycle.discharge_date 
                                    ? Math.ceil((new Date(cycle.discharge_date).getTime() - new Date(cycle.admission_date).getTime()) / (1000 * 60 * 60 * 24))
                                    : Math.ceil((new Date().getTime() - new Date(cycle.admission_date).getTime()) / (1000 * 60 * 60 * 24))
                                }일
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {cycle.status === 'admitted' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDischarge(cycle.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                퇴원
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 패키지 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                패키지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {packages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>등록된 패키지가 없습니다.</p>
                  </div>
                ) : (
                  packages.map((pkg) => (
                    <Card key={pkg.id} className="border">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{pkg.package_type}</h4>
                            <Badge variant={pkg.outstanding_balance > 0 ? 'destructive' : 'secondary'}>
                              {pkg.outstanding_balance > 0 ? '미납' : '완납'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">총 비용</p>
                              <p className="font-medium">{pkg.total_cost.toLocaleString()}원</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">환자 부담</p>
                              <p className="font-medium">{pkg.patient_payment.toLocaleString()}원</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">미납금</p>
                              <p className="font-medium text-destructive">{pkg.outstanding_balance.toLocaleString()}원</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">기간</p>
                              <p className="font-medium">
                                {format(new Date(pkg.start_date), 'MM/dd')} - {format(new Date(pkg.end_date), 'MM/dd')}
                              </p>
                            </div>
                          </div>
                          {pkg.admission_cycle_id && (
                            <div className="pt-2">
                              <Badge variant="outline" className="text-xs">
                                {admissionCycles.find(c => c.id === pkg.admission_cycle_id)?.cycle_number}차 입원
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 메모/코멘트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                메모/코멘트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patientNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>등록된 메모가 없습니다.</p>
                  </div>
                ) : (
                  patientNotes.map((note) => (
                    <Card key={note.id} className={`${getNoteTypeColor(note.note_type)} ${note.is_important ? 'ring-2 ring-yellow-400' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {getNoteTypeLabel(note.note_type)}
                              </Badge>
                              {note.is_important && (
                                <Badge variant="destructive" className="text-xs">
                                  중요
                                </Badge>
                              )}
                              {note.admission_cycle_id && (
                                <Badge variant="secondary" className="text-xs">
                                  {admissionCycles.find(c => c.id === note.admission_cycle_id)?.cycle_number}차 입원
                                </Badge>
                              )}
                            </div>
                            {note.title && (
                              <h4 className="font-medium mb-2">{note.title}</h4>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {note.creator_name} · {format(new Date(note.created_at), 'yyyy-MM-dd HH:mm')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}