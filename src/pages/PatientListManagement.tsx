import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search } from "lucide-react";

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

export default function PatientListManagement() {
  // Force rebuild - no Eye icon references
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);
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
                    onClick={() => setSelectedPatientDetail(patient)}
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
                    <TableCell className="max-w-32 truncate">
                      {patient.treatment_plan || '-'}
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
      <Dialog open={!!selectedPatientDetail} onOpenChange={() => setSelectedPatientDetail(null)}>
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
                    <span className="font-medium">내담자:</span>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}