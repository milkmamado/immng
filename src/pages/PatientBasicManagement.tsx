import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientBasicForm } from "@/components/PatientBasicForm";

interface Patient {
  id: string;
  patient_number: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
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
  chart_number?: string;
  insurance_type?: string;
  hospital_treatment?: string;
  examination_schedule?: string;
  treatment_plan?: string;
  monthly_avg_days?: number;
  last_visit_date?: string;
  payment_amount?: number;
  manager_name?: string;
}

export default function PatientBasicManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, statusFilter]);

  const fetchPatients = async () => {
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

  const filterPatients = () => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.detailed_diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(patient => patient.inflow_status === statusFilter);
    }

    setFilteredPatients(filtered);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleDelete = async (patientId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "성공",
        description: "환자가 삭제되었습니다.",
      });
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "오류",
        description: "환자 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPatient(null);
    fetchPatients();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">환자 기본 관리</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          환자 등록
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>환자 검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="환자명, 환자번호, 진단명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="유입">유입</SelectItem>
                <SelectItem value="실패">실패</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>환자 목록 ({filteredPatients.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>환자번호</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>나이</TableHead>
                  <TableHead>성별</TableHead>
                  <TableHead>진단명</TableHead>
                  <TableHead>유입상태</TableHead>
                  <TableHead>내원동기</TableHead>
                  <TableHead>담당실장</TableHead>
                  <TableHead>최근내원일</TableHead>
                  <TableHead>수납금액</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.patient_number}</TableCell>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>{patient.detailed_diagnosis}</TableCell>
                    <TableCell>
                      <Badge variant={patient.inflow_status === '유입' ? 'default' : 'destructive'}>
                        {patient.inflow_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-32 truncate">{patient.visit_motivation}</TableCell>
                    <TableCell>{patient.manager_name}</TableCell>
                    <TableCell>{patient.last_visit_date}</TableCell>
                    <TableCell className="text-right">
                      {patient.payment_amount?.toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(patient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(patient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              검색 조건에 맞는 환자가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <PatientBasicForm
          patient={editingPatient}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}