import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Activity, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalPatients: number;
  inflowPatients: number;
  failedPatients: number;
  todayStatuses: number;
  thisWeekStatuses: number;
  recentPatients: Array<{
    id: string;
    name: string;
    patient_number: string;
    inflow_status?: string;
    created_at: string;
    detailed_diagnosis?: string;
  }>;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    inflowPatients: 0,
    failedPatients: 0,
    todayStatuses: 0,
    thisWeekStatuses: 0,
    recentPatients: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 환자 통계
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, name, patient_number, inflow_status, created_at, detailed_diagnosis')
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      // 오늘과 이번 주 상태 기록
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: todayStatuses, error: todayError } = await supabase
        .from('daily_patient_status')
        .select('id')
        .eq('status_date', today);

      const { data: weekStatuses, error: weekError } = await supabase
        .from('daily_patient_status')
        .select('id')
        .gte('status_date', weekAgo);

      if (todayError) throw todayError;
      if (weekError) throw weekError;

      const totalPatients = patients?.length || 0;
      const inflowPatients = patients?.filter(p => p.inflow_status === '유입').length || 0;
      const failedPatients = patients?.filter(p => p.inflow_status === '실패').length || 0;

      setStats({
        totalPatients,
        inflowPatients,
        failedPatients,
        todayStatuses: todayStatuses?.length || 0,
        thisWeekStatuses: weekStatuses?.length || 0,
        recentPatients: patients?.slice(0, 5) || []
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">환자 관리 대시보드</h1>
          <p className="text-muted-foreground">Excel 시트 기반 환자 관리 시스템</p>
        </div>
        <Button 
          onClick={() => navigate('/patients')} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          환자 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 환자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              등록된 총 환자 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">유입 환자</CardTitle>
            <Badge variant="default">유입</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.inflowPatients}</div>
            <p className="text-xs text-muted-foreground">
              성공적으로 유입된 환자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 상태 기록</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayStatuses}</div>
            <p className="text-xs text-muted-foreground">
              오늘 입력된 상태 기록
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 주 활동</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeekStatuses}</div>
            <p className="text-xs text-muted-foreground">
              이번 주 전체 상태 기록
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 최근 등록 환자 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              최근 등록 환자
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentPatients.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                등록된 환자가 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.patient_number}
                      </div>
                      {patient.detailed_diagnosis && (
                        <div className="text-xs text-muted-foreground">
                          {patient.detailed_diagnosis}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={patient.inflow_status === '유입' ? 'default' : 'destructive'}
                      >
                        {patient.inflow_status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(patient.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/patients')}
            >
              <Users className="h-4 w-4 mr-2" />
              환자 기본 관리
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/daily-tracking')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              일별 상태 추적
            </Button>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">시스템 정보</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>• Excel 시트 기반 구조</div>
                <div>• 실시간 상태 추적</div>
                <div>• 통합 환자 관리</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}