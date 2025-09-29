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
  phone?: string;
  age?: number;
  gender?: string;
  first_visit_date?: string;
  inflow_status?: string;
  detailed_diagnosis?: string;
  manager_name?: string;
  korean_doctor?: string;
  western_doctor?: string;
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
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">관리 환자 리스트</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>전체 환자 목록 ({filteredPatients.length}명)</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="환자명, 환자번호, 전화번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>환자번호</TableHead>
                  <TableHead>환자명</TableHead>
                  <TableHead>나이/성별</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>유입상태</TableHead>
                  <TableHead>진단명</TableHead>
                  <TableHead>담당매니저</TableHead>
                  <TableHead>한방의</TableHead>
                  <TableHead>양방의</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-mono">{patient.patient_number}</TableCell>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>
                      {patient.age && patient.gender ? `${patient.age}세/${patient.gender}` : '-'}
                    </TableCell>
                    <TableCell>{patient.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getInflowStatusColor(patient.inflow_status)}>
                        {patient.inflow_status || '미분류'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-40 truncate">
                      {patient.detailed_diagnosis || '-'}
                    </TableCell>
                    <TableCell>{patient.manager_name || '-'}</TableCell>
                    <TableCell>{patient.korean_doctor || '-'}</TableCell>
                    <TableCell>{patient.western_doctor || '-'}</TableCell>
                    <TableCell>
                      {new Date(patient.created_at).toLocaleDateString('ko-KR')}
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
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 환자가 없습니다.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}