import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PatientBasicForm } from "@/components/PatientBasicForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Plus } from "lucide-react";
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
    <div className="container mx-auto p-6">
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

      <Card>
        <CardHeader>
          <CardTitle>등록된 환자 목록 ({patients.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
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
                  <TableHead>내담자</TableHead>
                  <TableHead>이전병원</TableHead>
                  <TableHead>식이</TableHead>
                  <TableHead>한방주치의</TableHead>
                  <TableHead>양방주치의</TableHead>
                  <TableHead>상담내용</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
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
                    <TableCell className="max-w-32 truncate">
                      {patient.counseling_content || '-'}
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
    </div>
  );
}