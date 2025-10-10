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
import { Heart, Plus, Eye, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Patient {
  id: string;
  name: string;
  customer_number?: string;
  resident_number_masked?: string;
  phone?: string;
  gender?: string;
  age?: number;
  address?: string;
  inflow_status?: string;
  first_visit_date?: string;
  visit_type?: string;
  visit_motivation?: string;
  diagnosis_category?: string;
  diagnosis_detail?: string;
  hospital_category?: string;
  hospital_branch?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  manager_name?: string;
  patient_or_guardian?: string;
  diet_info?: string;
  korean_doctor?: string;
  western_doctor?: string;
  crm_memo?: string;
  memo1?: string;
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
      (patient.customer_number && patient.customer_number.toLowerCase().includes(search)) ||
      (patient.manager_name && patient.manager_name.toLowerCase().includes(search)) ||
      (patient.visit_type && patient.visit_type.toLowerCase().includes(search)) ||
      (patient.korean_doctor && patient.korean_doctor.toLowerCase().includes(search)) ||
      (patient.western_doctor && patient.western_doctor.toLowerCase().includes(search)) ||
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
                    <TableCell>{patient.patient_or_guardian || '-'}</TableCell>
                    <TableCell>{patient.hospital_category || '-'}</TableCell>
                    <TableCell className="max-w-32 truncate">{patient.diet_info || '-'}</TableCell>
                    <TableCell>{patient.korean_doctor || '-'}</TableCell>
                    <TableCell>{patient.manager_name || '-'}</TableCell>
                    <TableCell>{patient.western_doctor || '-'}</TableCell>
                    <TableCell className="max-w-32 truncate">{patient.crm_memo || '-'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setPatientToDelete(patient)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        삭제
                      </Button>
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
          {selectedPatientDetail && (
            <PatientBasicForm 
              patient={selectedPatientDetail} 
              onClose={() => {
                setSelectedPatientDetail(null);
                fetchPatients();
              }} 
            />
          )}
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
    </div>
  );
}