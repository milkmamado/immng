import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PatientBasicForm } from "@/components/PatientBasicForm";
import { PatientLookupDialog } from "@/components/PatientLookupDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Heart, Plus, Eye, Trash2, Edit, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Patient {
  id: string;
  name: string;
  patient_number: string;
  customer_number?: string;
  birth_date?: string;
  phone?: string;
  gender?: string;
  age?: number;
  address?: string;
  inflow_status?: string;
  visit_type?: string;
  visit_motivation?: string;
  diagnosis_category?: string;
  diagnosis_detail?: string;
  counselor?: string;
  hospital_category?: string;
  hospital_branch?: string;
  diet_info?: string;
  korean_doctor?: string;
  manager_name?: string;
  western_doctor?: string;
  crm_memo?: string;
  created_at: string;
}

export default function FirstVisitManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLookupDialog, setShowLookupDialog] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [initialFormData, setInitialFormData] = useState<{ name: string; phone: string } | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { userRole } = useAuth();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "오류",
        description: "환자 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToRegistration = (name: string, phone: string) => {
    setInitialFormData({ name, phone });
    setShowLookupDialog(false);
    setShowFullForm(true);
  };

  const handleClose = () => {
    setShowFullForm(false);
    setInitialFormData(null);
    fetchPatients();
    toast({
      title: "등록 완료",
      description: "환자가 성공적으로 등록되었습니다.",
    });
  };

  const handleEditClose = () => {
    setSelectedPatientForEdit(null);
    fetchPatients(); // 환자 수정 후 리스트 새로고침
    toast({
      title: "수정 완료",
      description: "환자 정보가 성공적으로 수정되었습니다.",
    });
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientToDelete.id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "환자가 성공적으로 삭제되었습니다.",
      });
      
      fetchPatients(); // 목록 새로고침
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "오류",
        description: "환자 삭제에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setPatientToDelete(null);
    }
  };

  const getInflowStatusColor = (status?: string) => {
    switch (status) {
      case '유입':
        return 'default';
      case '실패':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // 검색 필터링
  const filteredPatients = patients.filter((patient) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(search) ||
      patient.patient_number.toLowerCase().includes(search) ||
      (patient.manager_name && patient.manager_name.toLowerCase().includes(search)) ||
      (patient.western_doctor && patient.western_doctor.toLowerCase().includes(search)) ||
      (patient.korean_doctor && patient.korean_doctor.toLowerCase().includes(search)) ||
      (patient.visit_type && patient.visit_type.toLowerCase().includes(search)) ||
      (patient.hospital_category && patient.hospital_category.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  return (
    <div className="max-w-none mx-auto p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">초진관리</h1>
        </div>
        {userRole === 'manager' && (
          <Button onClick={() => setShowLookupDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            새 환자 등록
          </Button>
        )}
      </div>

      <Card className="w-full overflow-x-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>등록된 환자 목록 ({filteredPatients.length}명)</CardTitle>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="환자명, 등록번호, 담당자, 주치의, 입원/외래, 이전병원으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1400px]">
              <TableHeader>
                <TableRow>
                  <TableHead>고객번호</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>유입/실패</TableHead>
                  <TableHead>입원/외래</TableHead>
                  <TableHead>내원동기</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>진단명</TableHead>
                  <TableHead>세부진단명</TableHead>
                  <TableHead>환자 or 보호자</TableHead>
                  <TableHead>이전병원</TableHead>
                  <TableHead>식이</TableHead>
                  <TableHead>한방주치의</TableHead>
                  <TableHead>담당자(상담실장)</TableHead>
                  <TableHead>양방주치의</TableHead>
                  <TableHead>CRM메모</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow 
                    key={patient.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPatientDetail(patient)}
                  >
                    <TableCell>{patient.customer_number || '-'}</TableCell>
                    <TableCell>
                      {new Date(patient.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getInflowStatusColor(patient.inflow_status)}>
                        {patient.inflow_status || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{patient.visit_type || '-'}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.visit_motivation || '-'}
                    </TableCell>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.diagnosis_category || '-'}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.diagnosis_detail || '-'}
                    </TableCell>
                    <TableCell>{patient.counselor || '-'}</TableCell>
                    <TableCell>{patient.hospital_category || '-'}</TableCell>
                    <TableCell>{patient.diet_info || '-'}</TableCell>
                    <TableCell>{patient.korean_doctor || '-'}</TableCell>
                    <TableCell>{patient.manager_name || '-'}</TableCell>
                    <TableCell>{patient.western_doctor || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {patient.crm_memo ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(patient);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            상세보기
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPatientForEdit(patient)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setPatientToDelete(patient)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredPatients.length === 0 && patients.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          )}
          
          {patients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              등록된 환자가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 고객 정보 조회 다이얼로그 */}
      <PatientLookupDialog
        open={showLookupDialog}
        onOpenChange={setShowLookupDialog}
        onProceedToRegistration={handleProceedToRegistration}
      />

      {/* 새 환자 등록 다이얼로그 */}
      <Dialog open={showFullForm} onOpenChange={setShowFullForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 환자 등록</DialogTitle>
          </DialogHeader>
          <PatientBasicForm 
            onClose={handleClose} 
            initialData={initialFormData}
          />
        </DialogContent>
      </Dialog>

      {/* 상담내용 모달 다이얼로그 */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPatient?.name} - CRM메모</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {selectedPatient?.crm_memo || "CRM메모가 없습니다."}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 환자 상세정보 모달 다이얼로그 */}
      <Dialog open={!!selectedPatientDetail} onOpenChange={() => setSelectedPatientDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPatientDetail?.name} - 환자 상세정보</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span className="font-medium">고객번호:</span>
                    <span>{selectedPatientDetail?.customer_number || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">생년월일:</span>
                    <span>
                      {selectedPatientDetail?.birth_date ? 
                        new Date(selectedPatientDetail.birth_date).toLocaleDateString('ko-KR') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">연락처:</span>
                    <span>{selectedPatientDetail?.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">성별/나이:</span>
                    <span>
                      {selectedPatientDetail?.gender || '-'} / {selectedPatientDetail?.age ? `${selectedPatientDetail.age}세` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">주소:</span>
                    <span>{selectedPatientDetail?.address || '-'}</span>
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">진료 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">진단명 (대분류):</span>
                    <span>{selectedPatientDetail?.diagnosis_category || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">진단명 (중분류):</span>
                    <span>{selectedPatientDetail?.diagnosis_detail || '-'}</span>
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
                    <span className="font-medium">담당자(상담실장):</span>
                    <span>{selectedPatientDetail?.manager_name || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">추가 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">이전병원 (대분류):</span>
                    <span>{selectedPatientDetail?.hospital_category || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">이전병원 (중분류):</span>
                    <span>{selectedPatientDetail?.hospital_branch || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">식이:</span>
                    <span>{selectedPatientDetail?.diet_info || '-'}</span>
                  </div>
                </CardContent>
              </Card>

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

            {selectedPatientDetail?.crm_memo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CRM메모</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedPatientDetail.crm_memo}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 환자 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!patientToDelete} onOpenChange={() => setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>환자 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              "{patientToDelete?.name}" 환자를 삭제하시겠습니까?
              <br />
              삭제된 환자 정보는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePatient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 환자 수정 다이얼로그 */}
      <Dialog open={!!selectedPatientForEdit} onOpenChange={() => setSelectedPatientForEdit(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPatientForEdit?.name} - 환자 정보 수정</DialogTitle>
          </DialogHeader>
          <PatientBasicForm patient={selectedPatientForEdit} onClose={handleEditClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}