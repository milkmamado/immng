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
import { Heart, Plus, Eye, Trash2, Search, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DateRangeFilter } from "@/components/TableFilters/DateRangeFilter";
import { InflowStatusFilter } from "@/components/TableFilters/InflowStatusFilter";
import { VisitTypeFilter } from "@/components/TableFilters/VisitTypeFilter";
import { DiagnosisFilter } from "@/components/TableFilters/DiagnosisFilter";

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
  inflow_date?: string;
  consultation_date?: string;
  first_visit_date?: string;
  visit_type?: string;
  visit_motivation?: string;
  
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
  
  // 필터 상태
  const [inflowDateStart, setInflowDateStart] = useState<Date | undefined>();
  const [inflowDateEnd, setInflowDateEnd] = useState<Date | undefined>();
  const [selectedInflowStatuses, setSelectedInflowStatuses] = useState<string[]>([]);
  const [selectedVisitTypes, setSelectedVisitTypes] = useState<string[]>([]);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  
  const { toast } = useToast();
  const { userRole } = useAuth();

  useEffect(() => {
    fetchPatients();

    // Realtime 구독 설정 - patients 테이블 변경 감지
    const channel = supabase
      .channel('first-visit-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모두 감지
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          console.log('Patient data changed:', payload);
          // 데이터 변경 시 자동으로 다시 불러오기
          fetchPatients();
        }
      )
      .subscribe();

    // postMessage로 CRM 데이터 수신 (window.opener에서 전송)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'crm-patient-data' && event.data?.data) {
        // 업데이트 모드인 경우 무시 (PatientBasicForm에서 처리)
        const updateMode = localStorage.getItem('crm_update_mode');
        if (updateMode) {
          return;
        }

        handleProceedToRegistration(event.data.data);
        setShowLookupDialog(false);
        toast({
          title: "CRM 데이터 가져오기 성공",
          description: `${event.data.data.name} 환자 정보를 불러왔습니다.`,
          duration: 1000,
        });
      }
    };

    // URL 파라미터에서 crm=import 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('crm') === 'import') {
      // localStorage에서 CRM 데이터 확인 (CRM 연동 또는 Chrome 확장 프로그램)
      const checkStorage = async () => {
        // 먼저 localStorage 확인 (CRM 연동용)
        const localData = localStorage.getItem('crm_patient_data');
        if (localData) {
          try {
            const data = JSON.parse(localData);
            handleProceedToRegistration(data);
            setShowLookupDialog(false);
            localStorage.removeItem('crm_patient_data');
            toast({
              title: "CRM 데이터 가져오기 성공",
              description: `${data.name} 환자 정보를 불러왔습니다.`,
              duration: 1000,
            });
            window.history.replaceState({}, '', '/first-visit');
            return;
          } catch (e) {
            console.error('Failed to parse localStorage CRM data:', e);
          }
        }

        // Chrome 확장 프로그램의 storage 확인
        const chromeAPI = (window as any).chrome;
        if (chromeAPI?.storage?.local) {
          try {
            chromeAPI.storage.local.get(['patientData'], (result: any) => {
              if (result.patientData) {
                handleProceedToRegistration(result.patientData);
                setShowLookupDialog(false);
                chromeAPI.storage.local.remove('patientData');
                toast({
                  title: "CRM 데이터 가져오기 성공",
                  description: `${result.patientData.name} 환자 정보를 불러왔습니다.`,
                  duration: 1000,
                });
                window.history.replaceState({}, '', '/first-visit');
              }
            });
          } catch (e) {
            console.error('Failed to access chrome.storage:', e);
          }
        }
      };

      checkStorage();
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      supabase.removeChannel(channel);
    };
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

  const handleProceedToRegistration = (data: any) => {
    setInitialFormData(data);
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
      duration: 1000,
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
        duration: 1000,
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

  const handleExportToExcel = () => {
    try {
      // 엑셀로 내보낼 데이터 준비
      const exportData = filteredPatients.map(patient => ({
        '고객번호': patient.customer_number || '-',
        '상담일': patient.consultation_date 
          ? new Date(patient.consultation_date).toLocaleDateString('ko-KR')
          : '-',
        '유입일': patient.inflow_date 
          ? new Date(patient.inflow_date).toLocaleDateString('ko-KR')
          : new Date(patient.created_at).toLocaleDateString('ko-KR'),
        '유입/실패': patient.inflow_status || '-',
        '입원/외래': patient.visit_type || '-',
        '내원동기': patient.visit_motivation || '-',
        '이름': patient.name,
        '진단명': patient.diagnosis_detail || '-',
        '세부진단명': patient.diagnosis_detail || '-',
        '환자 or 보호자': patient.patient_or_guardian || '-',
        '이전병원': patient.hospital_category || '-',
        '한방주치의': patient.korean_doctor || '-',
        '담당자(상담실장)': patient.manager_name || '-',
        '양방주치의': patient.western_doctor || '-',
        'CRM메모': patient.crm_memo || '-',
      }));

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '초진관리');

      // 파일명 생성 (현재 날짜 포함)
      const fileName = `초진관리_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "엑셀 내보내기 완료",
        description: `${filteredPatients.length}명의 환자 정보를 내보냈습니다.`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "오류",
        description: "엑셀 파일 생성에 실패했습니다.",
        variant: "destructive",
      });
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

  // 검색 및 필터링
  const filteredPatients = patients.filter((patient) => {
    // 기존 검색 필터
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        patient.name.toLowerCase().includes(search) ||
        (patient.customer_number && patient.customer_number.toLowerCase().includes(search)) ||
        (patient.manager_name && patient.manager_name.toLowerCase().includes(search)) ||
        (patient.visit_type && patient.visit_type.toLowerCase().includes(search)) ||
        (patient.korean_doctor && patient.korean_doctor.toLowerCase().includes(search)) ||
        (patient.western_doctor && patient.western_doctor.toLowerCase().includes(search)) ||
        (patient.hospital_category && patient.hospital_category.toLowerCase().includes(search));
      
      if (!matchesSearch) return false;
    }

    // 유입일 필터
    if (inflowDateStart || inflowDateEnd) {
      const patientDate = patient.inflow_date ? new Date(patient.inflow_date) : new Date(patient.created_at);
      if (inflowDateStart && patientDate < inflowDateStart) return false;
      if (inflowDateEnd && patientDate > inflowDateEnd) return false;
    }

    // 유입상태 필터
    if (selectedInflowStatuses.length > 0) {
      if (!patient.inflow_status || !selectedInflowStatuses.includes(patient.inflow_status)) {
        return false;
      }
    }

    // 입원/외래 필터
    if (selectedVisitTypes.length > 0) {
      if (!patient.visit_type || !selectedVisitTypes.includes(patient.visit_type)) {
        return false;
      }
    }

    // 진단명 필터
    if (diagnosisSearch.trim()) {
      const diagnosisText = diagnosisSearch.toLowerCase();
      const matchesDiagnosis = 
        (patient.diagnosis_detail && patient.diagnosis_detail.toLowerCase().includes(diagnosisText));
      
      if (!matchesDiagnosis) return false;
    }

    return true;
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
            <div className="flex items-center gap-2">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="환자명, 등록번호, 담당자, 주치의, 입원/외래, 이전병원으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleExportToExcel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                엑셀 내보내기
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1400px]">
              <TableHeader>
                <TableRow>
                  <TableHead>고객번호</TableHead>
                  <TableHead>상담일</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      유입일
                      <DateRangeFilter
                        startDate={inflowDateStart}
                        endDate={inflowDateEnd}
                        onDateChange={(start, end) => {
                          setInflowDateStart(start);
                          setInflowDateEnd(end);
                        }}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      유입/실패
                      <InflowStatusFilter
                        selectedStatuses={selectedInflowStatuses}
                        onStatusChange={setSelectedInflowStatuses}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      입원/외래
                      <VisitTypeFilter
                        selectedTypes={selectedVisitTypes}
                        onTypeChange={setSelectedVisitTypes}
                      />
                    </div>
                  </TableHead>
                  <TableHead>내원동기</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      진단명
                      <DiagnosisFilter
                        searchText={diagnosisSearch}
                        onSearchChange={setDiagnosisSearch}
                      />
                    </div>
                  </TableHead>
                  <TableHead>세부진단명</TableHead>
                  <TableHead>환자 or 보호자</TableHead>
                  <TableHead>이전병원</TableHead>
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
                      {patient.consultation_date 
                        ? new Date(patient.consultation_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {patient.inflow_date 
                        ? new Date(patient.inflow_date).toLocaleDateString('ko-KR')
                        : new Date(patient.created_at).toLocaleDateString('ko-KR')}
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
                    <TableCell>{patient.diagnosis_detail || '-'}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.diagnosis_detail || '-'}
                    </TableCell>
                    <TableCell>{patient.patient_or_guardian || '-'}</TableCell>
                    <TableCell>{patient.hospital_category || '-'}</TableCell>
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