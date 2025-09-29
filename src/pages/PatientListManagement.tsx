import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Eye } from "lucide-react";

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
  detailed_diagnosis?: string;
  manager_name?: string;
  korean_doctor?: string;
  western_doctor?: string;
  insurance_type?: string;
  hospital_treatment?: string;
  examination_schedule?: string;
  treatment_plan?: string;
  monthly_avg_days?: number;
  payment_amount?: number;
  created_at: string;
}

export default function PatientListManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
            <Table className="min-w-[1800px]">
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
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
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
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        상세
                      </Button>
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
    </div>
  );
}