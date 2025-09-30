import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DailyStatusGrid } from "@/components/DailyStatusGrid";
import { Calendar, Users, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  name: string;
  patient_number: string;
  diagnosis?: string;
  detailed_diagnosis?: string;
  korean_doctor?: string;
  western_doctor?: string;
  manager_name?: string;
  previous_hospital?: string;
}

interface DailyStatus {
  id: string;
  patient_id: string;
  status_date: string;
  status_type: string;
  notes?: string;
}

export default function DailyStatusTracking() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dailyStatuses, setDailyStatuses] = useState<DailyStatus[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    총환자: 0,
    입원: 0,
    외래: 0,
    전화FU: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 환자 목록 가져오기
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, name, patient_number, diagnosis, detailed_diagnosis, korean_doctor, western_doctor, manager_name, previous_hospital')
        .order('name');

      if (patientsError) throw patientsError;
      setPatients(patientsData || []);

      // 선택된 월의 일별 상태 가져오기
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      const { data: statusData, error: statusError } = await supabase
        .from('daily_patient_status')
        .select('*')
        .gte('status_date', startDate)
        .lte('status_date', endDate);

      if (statusError) throw statusError;
      setDailyStatuses(statusData || []);

      // 통계 계산
      const statusCounts = (statusData || []).reduce((acc, status) => {
        acc[status.status_type] = (acc[status.status_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setStats({
        총환자: patientsData?.length || 0,
        입원: statusCounts['입원'] || 0,
        외래: statusCounts['외래'] || 0,
        전화FU: statusCounts['전화F/U'] || 0
      });

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

  const handleStatusUpdate = async (patientId: string, date: string, statusType: string, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { error } = await supabase
        .from('daily_patient_status')
        .upsert({
          patient_id: patientId,
          status_date: date,
          status_type: statusType,
          notes: notes || null,
          created_by: user.id
        }, {
          onConflict: 'patient_id,status_date,status_type'
        });

      if (error) throw error;

      toast({
        title: "성공",
        description: "상태가 업데이트되었습니다.",
      });

      fetchData(); // 데이터 새로고침
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "오류",
        description: "상태 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const getDaysInMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">일별 환자 상태 추적</h1>
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(i);
                const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">총 환자</p>
              <p className="text-2xl font-bold">{stats.총환자}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">입원</p>
              <p className="text-2xl font-bold text-red-600">{stats.입원}</p>
            </div>
            <Badge variant="destructive" className="h-8 w-8 rounded-full flex items-center justify-center">
              입
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">외래</p>
              <p className="text-2xl font-bold text-green-600">{stats.외래}</p>
            </div>
            <Badge variant="default" className="h-8 w-8 rounded-full flex items-center justify-center">
              외
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">전화F/U</p>
              <p className="text-2xl font-bold text-blue-600">{stats.전화FU}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
      </div>

      {/* 일별 상태 그리드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {selectedMonth.split('-')[0]}년 {selectedMonth.split('-')[1]}월 환자 상태 추적
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DailyStatusGrid
            patients={patients}
            dailyStatuses={dailyStatuses}
            yearMonth={selectedMonth}
            daysInMonth={getDaysInMonth(selectedMonth)}
            onStatusUpdate={handleStatusUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
}