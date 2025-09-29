import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PatientBasicForm } from "@/components/PatientBasicForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Heart, Plus, Eye, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  name: string;
  patient_number: string;
  chart_number?: string;
  inflow_status?: string;
  visit_type?: string;
  visit_motivation?: string;
  detailed_diagnosis?: string;
  counselor?: string;
  previous_hospital?: string;
  diet_info?: string;
  korean_doctor?: string;
  western_doctor?: string;
  counseling_content?: string;
  created_at: string;
}

export default function FirstVisitManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);
  const { toast } = useToast();

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

  const handleClose = () => {
    setShowForm(false);
    fetchPatients(); // 새 환자 등록 후 리스트 새로고침
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
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          새 환자 등록
        </Button>
      </div>

      <Card className="w-full overflow-x-auto">
        <CardHeader>
          <CardTitle>등록된 환자 목록 ({patients.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1400px]">
              <TableHeader>
                <TableRow>
                  <TableHead>차트번호</TableHead>
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
                  <TableHead>양방주치의</TableHead>
                  <TableHead>상담내용</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow 
                    key={patient.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPatientDetail(patient)}
                  >
                    <TableCell>{patient.chart_number || '-'}</TableCell>
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
                    <TableCell>{patient.detailed_diagnosis || '-'}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.detailed_diagnosis || '-'}
                    </TableCell>
                    <TableCell>{patient.counselor || '-'}</TableCell>
                    <TableCell>{patient.previous_hospital || '-'}</TableCell>
                    <TableCell>{patient.diet_info || '-'}</TableCell>
                    <TableCell>{patient.korean_doctor || '-'}</TableCell>
                    <TableCell>{patient.western_doctor || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {patient.counseling_content ? (
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
          
          {patients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              등록된 환자가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 새 환자 등록 다이얼로그 */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 환자 등록</DialogTitle>
          </DialogHeader>
          <PatientBasicForm onClose={handleClose} />
        </DialogContent>
      </Dialog>

      {/* 상담내용 모달 다이얼로그 */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPatient?.name} - 상담내용</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {selectedPatient?.counseling_content || "상담내용이 없습니다."}
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
                    <span className="font-medium">차트번호:</span>
                    <span>{selectedPatientDetail?.chart_number || '-'}</span>
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
                </CardContent>
              </Card>

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