import { useState, useEffect, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Download, Search, RefreshCw, Filter } from "lucide-react";
import * as XLSX from 'xlsx';
import { PatientDetailModal } from "@/components/PatientDetailModal";

interface Patient {
  id: string;
  name: string;
  customer_number?: string;
  resident_number_masked?: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  last_visit_date?: string;
  inflow_status?: string;
  inflow_date?: string;
  consultation_date?: string;
  visit_type?: string;
  visit_motivation?: string;
  diagnosis_category?: string;
  diagnosis_detail?: string;
  counselor?: string;
  hospital_category?: string;
  hospital_branch?: string;
  diet_info?: string;
  manager_name?: string;
  korean_doctor?: string;
  western_doctor?: string;
  insurance_type?: string;
  hospital_treatment?: string;
  examination_schedule?: string;
  treatment_plan?: string;
  monthly_avg_inpatient_days?: number;
  monthly_avg_outpatient_days?: number;
  payment_amount?: number;
  crm_memo?: string;
  special_note_1?: string;
  special_note_2?: string;
  treatment_memo_1?: string;
  treatment_memo_2?: string;
  patient_or_guardian?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  management_status?: string;
  memo1?: string;
  created_at: string;
  assigned_manager: string;
  branch: string;
}

type UnclassifiedReason = 'missing_inflow_date' | 'missing_visit_type' | 'no_daily_activity' | 'inflow_status_mismatch';

interface UnclassifiedPatient extends Patient {
  reasons: UnclassifiedReason[];
  has_daily_activity: boolean;
}

export default function UnclassifiedPatientList() {
  const { applyBranchFilter, currentBranch } = useBranchFilter();
  const { userRole } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<UnclassifiedPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [managerNameFilter, setManagerNameFilter] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<UnclassifiedReason[]>([
    'missing_inflow_date',
    'missing_visit_type',
    'no_daily_activity',
    'inflow_status_mismatch'
  ]);
  
  // 환자 상세정보 모달 상태
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentBranch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 환자 데이터 가져오기 (관리상태 = 관리 중)
      // 유입상태가 '유입'인 환자 + 유입상태가 '유입'이 아닌데 관리 중인 환자 모두 포함
      let patientsQuery = supabase
        .from('patients')
        .select('*')
        .eq('management_status', '관리 중')
        .order('manager_name', { ascending: true });

      patientsQuery = applyBranchFilter(patientsQuery);

      const { data: patientsData, error: patientsError } = await patientsQuery;
      if (patientsError) throw patientsError;

      // 일별 환자 상태 데이터 가져오기 (환자별 활동 여부 확인)
      const patientIds = (patientsData || []).map(p => p.id);
      
      let dailyStatusMap = new Map<string, boolean>();
      
      if (patientIds.length > 0) {
        const { data: dailyStatusData } = await supabase
          .from('daily_patient_status')
          .select('patient_id')
          .in('patient_id', patientIds);

        // 일별 활동이 있는 환자 ID 수집
        const patientsWithActivity = new Set((dailyStatusData || []).map(d => d.patient_id));
        patientIds.forEach(id => {
          dailyStatusMap.set(id, patientsWithActivity.has(id));
        });
      }

      // 미분류 환자 필터링 및 이유 태깅
      const unclassifiedPatients: UnclassifiedPatient[] = (patientsData || [])
        .map(patient => {
          const reasons: UnclassifiedReason[] = [];
          const hasActivity = dailyStatusMap.get(patient.id) || false;

          // 유입상태 이상 (유입이 아닌데 관리 중)
          if (patient.inflow_status !== '유입') {
            reasons.push('inflow_status_mismatch');
          }

          // 유입상태가 '유입'인 경우에만 아래 조건 체크
          if (patient.inflow_status === '유입') {
            // 유입일 미등록
            if (!patient.inflow_date) {
              reasons.push('missing_inflow_date');
            }

            // 내원형태 미등록
            if (!patient.visit_type) {
              reasons.push('missing_visit_type');
            }

            // 일별 관리 활동 없음
            if (!hasActivity) {
              reasons.push('no_daily_activity');
            }
          }

          return {
            ...patient,
            reasons,
            has_daily_activity: hasActivity
          };
        })
        .filter(patient => patient.reasons.length > 0); // 최소 하나의 미분류 사유가 있는 환자만

      setPatients(unclassifiedPatients);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "오류",
        description: "데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 환자 목록
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      // 담당자 필터 (담당자 컬럼 클릭으로 설정)
      if (managerNameFilter && (patient.manager_name || '-') !== managerNameFilter) {
        return false;
      }

      // 검색어 필터
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          patient.name.toLowerCase().includes(search) ||
          (patient.customer_number && patient.customer_number.toLowerCase().includes(search)) ||
          (patient.manager_name && patient.manager_name.toLowerCase().includes(search));

        if (!matchesSearch) return false;
      }

      // 미분류 사유 필터
      if (selectedReasons.length > 0) {
        const hasMatchingReason = patient.reasons.some(reason => selectedReasons.includes(reason));
        if (!hasMatchingReason) return false;
      }

      return true;
    });
  }, [patients, managerNameFilter, searchTerm, selectedReasons]);

  const getReasonBadge = (reason: UnclassifiedReason) => {
    switch (reason) {
      case 'missing_inflow_date':
        return <Badge variant="destructive" className="text-xs">유입일 미등록</Badge>;
      case 'missing_visit_type':
        return <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">내원형태 미선택</Badge>;
      case 'no_daily_activity':
        return <Badge variant="secondary" className="text-xs">일별관리 미활동</Badge>;
      case 'inflow_status_mismatch':
        return <Badge variant="outline" className="text-xs border-purple-500 text-purple-600 bg-purple-50">유입상태 이상</Badge>;
    }
  };

  const toggleReason = (reason: UnclassifiedReason) => {
    setSelectedReasons(prev => 
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleExportToExcel = () => {
    const exportData = filteredPatients.map(patient => ({
      '담당자': patient.manager_name || '-',
      '환자명': patient.name,
      '고객번호': patient.customer_number || '-',
      '연락처': patient.phone || '-',
      '진단명': patient.diagnosis_category || '-',
      '유입일': patient.inflow_date || '미등록',
      '내원형태': patient.visit_type || '미선택',
      '일별관리활동': patient.has_daily_activity ? 'O' : 'X',
      '미분류사유': patient.reasons.map(r => {
        switch (r) {
          case 'missing_inflow_date': return '유입일 미등록';
          case 'missing_visit_type': return '내원형태 미선택';
          case 'no_daily_activity': return '일별관리 미활동';
          case 'inflow_status_mismatch': return '유입상태 이상';
        }
        return r;
      }).join(', '),
      '등록일': patient.created_at ? new Date(patient.created_at).toLocaleDateString('ko-KR') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '미분류 환자 리스트');
    
    const fileName = `미분류_환자_리스트_${currentBranch || '전체'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "엑셀 내보내기 완료",
      description: `${filteredPatients.length}명의 환자 데이터가 저장되었습니다.`,
    });
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalOpen(true);
  };

  const handlePatientUpdate = (updatedPatient: Patient) => {
    // 환자 정보가 업데이트되면 목록 새로고침
    fetchData();
  };

  // 관리자 전용 페이지 확인
  if (userRole !== 'admin' && userRole !== 'master') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-destructive">접근 권한 없음</h1>
          <p className="text-muted-foreground">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">데이터 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="max-w-none mx-auto p-6 w-full">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold">미분류 환자 리스트</h1>
          <p className="text-muted-foreground text-sm">
            필수 정보가 누락되거나 일별 관리 활동이 없는 환자 목록입니다.
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">전체 미분류 환자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{patients.length}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">유입상태 이상</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">
              {patients.filter(p => p.reasons.includes('inflow_status_mismatch')).length}명
            </div>
            <p className="text-xs text-muted-foreground mt-1">유입 아닌데 관리 중</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">유입일 미등록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {patients.filter(p => p.reasons.includes('missing_inflow_date')).length}명
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">내원형태 미선택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {patients.filter(p => p.reasons.includes('missing_visit_type')).length}명
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">일별관리 미활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-500">
              {patients.filter(p => p.reasons.includes('no_daily_activity')).length}명
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 영역 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* 담당자 필터는 테이블의 담당자 컬럼 클릭으로 대체 */}
            {/* 미분류 사유 필터 */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">미분류 사유:</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="inflow_status_mismatch"
                  checked={selectedReasons.includes('inflow_status_mismatch')}
                  onCheckedChange={() => toggleReason('inflow_status_mismatch')}
                />
                <label htmlFor="inflow_status_mismatch" className="text-sm">유입상태 이상</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="missing_inflow_date"
                  checked={selectedReasons.includes('missing_inflow_date')}
                  onCheckedChange={() => toggleReason('missing_inflow_date')}
                />
                <label htmlFor="missing_inflow_date" className="text-sm">유입일 미등록</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="missing_visit_type"
                  checked={selectedReasons.includes('missing_visit_type')}
                  onCheckedChange={() => toggleReason('missing_visit_type')}
                />
                <label htmlFor="missing_visit_type" className="text-sm">내원형태 미선택</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="no_daily_activity"
                  checked={selectedReasons.includes('no_daily_activity')}
                  onCheckedChange={() => toggleReason('no_daily_activity')}
                />
                <label htmlFor="no_daily_activity" className="text-sm">일별관리 미활동</label>
              </div>
            </div>

            {/* 검색 */}
            <div className="flex items-center gap-2 ml-auto">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="환자명, 고객번호, 담당자 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            {/* 새로고침 & 엑셀 */}
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
            <Button onClick={handleExportToExcel} className="gap-2">
              <Download className="h-4 w-4" />
              엑셀 내보내기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 환자 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>미분류 환자 목록 ({filteredPatients.length}명)</span>
            {managerNameFilter ? (
              <Button variant="secondary" size="sm" onClick={() => setManagerNameFilter(null)}>
                {managerNameFilter} 필터 해제
              </Button>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">담당자</TableHead>
                  <TableHead className="w-24">환자명</TableHead>
                  <TableHead className="w-28">고객번호</TableHead>
                  <TableHead className="w-32">연락처</TableHead>
                  <TableHead className="w-32">진단명</TableHead>
                  <TableHead className="w-28">유입일</TableHead>
                  <TableHead className="w-24">내원형태</TableHead>
                  <TableHead className="w-24">일별관리</TableHead>
                  <TableHead>미분류 사유</TableHead>
                  <TableHead className="w-28">등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      미분류 환자가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow 
                      key={patient.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const name = patient.manager_name || '-';
                            setManagerNameFilter(prev => (prev === name ? null : name));
                          }}
                          className="text-left text-primary hover:underline"
                        >
                          {patient.manager_name || '-'}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handlePatientClick(patient)}
                          className="font-medium text-primary hover:underline text-left"
                        >
                          {patient.name}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{patient.customer_number || '-'}</TableCell>
                      <TableCell>{patient.phone || '-'}</TableCell>
                      <TableCell className="truncate max-w-32">{patient.diagnosis_category || '-'}</TableCell>
                      <TableCell>
                        {patient.inflow_date ? (
                          new Date(patient.inflow_date).toLocaleDateString('ko-KR')
                        ) : (
                          <span className="text-red-500 font-medium">미등록</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.visit_type || (
                          <span className="text-orange-500 font-medium">미선택</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.has_daily_activity ? (
                          <Badge variant="outline" className="text-green-600 border-green-500">O</Badge>
                        ) : (
                          <Badge variant="secondary">X</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {patient.reasons.map(reason => (
                            <span key={reason}>{getReasonBadge(reason)}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.created_at ? new Date(patient.created_at).toLocaleDateString('ko-KR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 환자 상세정보 모달 */}
      <PatientDetailModal
        patient={selectedPatient}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onPatientUpdate={handlePatientUpdate}
      />
    </div>
  );
}
