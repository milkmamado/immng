import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Search, Plus, Edit3, Check, X } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  patient_number: string;
  chart_number?: string;
  phone?: string;
  age?: number;
  gender?: string;
  first_visit_date?: string;
  last_visit_date?: string;
  inflow_status?: string;
  visit_type?: string;
  visit_motivation?: string;
  detailed_diagnosis?: string;
  counselor?: string;
  previous_hospital?: string;
  diet_info?: string;
  manager_name?: string;
  korean_doctor?: string;
  western_doctor?: string;
  insurance_type?: string;
  hospital_treatment?: string;
  examination_schedule?: string;
  treatment_plan?: string;
  monthly_avg_days?: number;
  payment_amount?: number;
  counseling_content?: string;
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

export default function PatientListManagement() {
  // Force rebuild - no Eye icon references
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
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchTerm))
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
      setPatients(data || []);
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

      setNewTreatmentDetail('');
      setNewTreatmentAmount('');
      setShowAddForm(false);
      fetchTreatmentPlans(selectedPatientDetail.id);
      
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

  const togglePaymentStatus = async (treatmentPlan: TreatmentPlan) => {
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
                placeholder="환자명, 차트번호로 검색..."
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
                  <TableHead>차트번호</TableHead>
                  <TableHead>외래/입원구분</TableHead>
                  <TableHead>담당실장</TableHead>
                  <TableHead>환자명</TableHead>
                  <TableHead>진단명</TableHead>
                  <TableHead>유입일</TableHead>
                  <TableHead>실비보험유형</TableHead>
                  <TableHead>본병원치료</TableHead>
                  <TableHead>본병원검사일정</TableHead>
                  <TableHead>우리병원치료계획</TableHead>
                  <TableHead>월평균입원/외래일수</TableHead>
                  <TableHead>마지막내원일</TableHead>
                  <TableHead>수납급액(비급여)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                   <TableRow 
                    key={patient.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedPatientDetail(patient);
                      fetchTreatmentPlans(patient.id);
                    }}
                  >
                    <TableCell className="font-mono">{patient.chart_number || '-'}</TableCell>
                    <TableCell>{patient.visit_type || '-'}</TableCell>
                    <TableCell>{patient.manager_name || '-'}</TableCell>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.detailed_diagnosis || '-'}
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
                            fetchTreatmentPlans(patient.id);
                          }}
                          className="px-2 py-1 h-6 text-xs"
                        >
                          상세보기
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {patient.monthly_avg_days ? `${patient.monthly_avg_days}일` : '-'}
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
                ))}
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
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPatientDetail?.name} - 환자 상세정보</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">이름:</span>
                    <span>{selectedPatientDetail?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">차트번호:</span>
                    <span>{selectedPatientDetail?.chart_number || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">환자번호:</span>
                    <span>{selectedPatientDetail?.patient_number || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">나이/성별:</span>
                    <span>
                      {selectedPatientDetail?.age && selectedPatientDetail?.gender ? 
                        `${selectedPatientDetail.age}세/${selectedPatientDetail.gender}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">연락처:</span>
                    <span>{selectedPatientDetail?.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">등록일:</span>
                    <span>
                      {selectedPatientDetail?.created_at ? 
                        new Date(selectedPatientDetail.created_at).toLocaleDateString('ko-KR') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">유입/실패:</span>
                    <Badge variant={getInflowStatusColor(selectedPatientDetail?.inflow_status)}>
                      {selectedPatientDetail?.inflow_status || '-'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">입원/외래:</span>
                    <span>{selectedPatientDetail?.visit_type || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 진료 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">진료 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">진단명:</span>
                    <span>{selectedPatientDetail?.detailed_diagnosis || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">세부진단명:</span>
                    <span>{selectedPatientDetail?.detailed_diagnosis || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">한방주치의:</span>
                    <span>{selectedPatientDetail?.korean_doctor || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">양방주치의:</span>
                    <span>{selectedPatientDetail?.western_doctor || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">환자 or 보호자:</span>
                    <span>{selectedPatientDetail?.counselor || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">담당실장:</span>
                    <span>{selectedPatientDetail?.manager_name || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 추가 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">추가 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">이전병원:</span>
                    <span>{selectedPatientDetail?.previous_hospital || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">식이:</span>
                    <span>{selectedPatientDetail?.diet_info || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 보험 및 치료 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">보험 및 치료</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">실비보험유형:</span>
                    <span>{selectedPatientDetail?.insurance_type || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">수납급액:</span>
                    <span className="font-semibold text-primary">
                      {selectedPatientDetail?.payment_amount ? 
                        `${selectedPatientDetail.payment_amount.toLocaleString()}원` : '-'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">월평균입원/외래일수:</span>
                    <span>
                      {selectedPatientDetail?.monthly_avg_days ? 
                        `${selectedPatientDetail.monthly_avg_days}일` : '-'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 일정 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">일정 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">유입일:</span>
                    <span>
                      {selectedPatientDetail?.first_visit_date ? 
                        new Date(selectedPatientDetail.first_visit_date).toLocaleDateString('ko-KR') :
                        (selectedPatientDetail?.created_at ? 
                          new Date(selectedPatientDetail.created_at).toLocaleDateString('ko-KR') : '-')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">마지막내원일:</span>
                    <span>
                      {selectedPatientDetail?.last_visit_date ? 
                        new Date(selectedPatientDetail.last_visit_date).toLocaleDateString('ko-KR') : '-'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 내원동기 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">내원동기</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">
                    {selectedPatientDetail?.visit_motivation || '내원동기가 기록되지 않았습니다.'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 본병원 치료 정보 */}
            {selectedPatientDetail?.hospital_treatment && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">본병원 치료</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedPatientDetail.hospital_treatment}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 검사 일정 */}
            {selectedPatientDetail?.examination_schedule && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">본병원 검사일정</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedPatientDetail.examination_schedule}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 우리병원 치료계획 */}
            {selectedPatientDetail?.treatment_plan && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">우리병원 치료계획</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedPatientDetail.treatment_plan}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 상담내용 */}
            {selectedPatientDetail?.counseling_content && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">상담내용</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedPatientDetail.counseling_content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 관리 환자 전용 정보 섹션 */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">관리 환자 전용 정보</h2>
              
              {/* 본병원 치료 정보 (관리 환자용) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">본병원 치료</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {selectedPatientDetail?.hospital_treatment || '본병원 치료 정보가 기록되지 않았습니다.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">본병원 검사일정</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {selectedPatientDetail?.examination_schedule || '본병원 검사일정이 기록되지 않았습니다.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 우리병원 치료계획 (관리 환자용) */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">우리병원 치료계획</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 연동된 치료 계획 목록 표시 */}
                  {treatmentPlans.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium mb-2">등록된 치료 내역</h4>
                      <div className="space-y-2">
                        {treatmentPlans.map((plan) => (
                          <div key={plan.id} className="flex justify-between items-center p-2 bg-background rounded border">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{plan.treatment_detail}</p>
                              <p className="text-xs text-muted-foreground">
                                {plan.treatment_amount.toLocaleString()}원
                              </p>
                            </div>
                            <Badge variant={plan.is_paid ? "default" : "secondary"} className="ml-2">
                              {plan.is_paid ? "수납완료" : "미수납"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      등록된 치료 계획이 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 치료 계획 관리 섹션 */}
              <div className="mt-6 border-t pt-6">
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
                        <Textarea
                          id="treatment-detail"
                          placeholder="치료상세 내용을 입력하세요"
                          value={newTreatmentDetail}
                          onChange={(e) => setNewTreatmentDetail(e.target.value)}
                          rows={3}
                        />
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}