import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface ManagerStats {
  manager_id: string;
  manager_name: string;
  total_patients: number;
  total_revenue: number;
  avg_revenue_per_patient: number;
  status_breakdown: {
    입원: number;
    외래: number;
    낮병동: number;
    전화FU: number;
  };
}

export default function StatisticsManagement() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [managerStats, setManagerStats] = useState<ManagerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalPatients: 0,
    totalRevenue: 0,
    avgRevenuePerPatient: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStatistics();
  }, [selectedMonth]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      // 유입 환자 목록 가져오기
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, assigned_manager, manager_name, payment_amount')
        .eq('inflow_status', '유입');

      if (patientsError) throw patientsError;

      // 해당 월의 일별 상태 가져오기
      const { data: dailyStatuses, error: statusError } = await supabase
        .from('daily_patient_status')
        .select('patient_id, status_type, status_date')
        .gte('status_date', startDate)
        .lte('status_date', endDate);

      if (statusError) throw statusError;

      // 실장별로 그룹핑
      const managerMap = new Map<string, ManagerStats>();

      patients?.forEach(patient => {
        const managerId = patient.assigned_manager;
        const managerName = patient.manager_name || '미지정';

        if (!managerMap.has(managerId)) {
          managerMap.set(managerId, {
            manager_id: managerId,
            manager_name: managerName,
            total_patients: 0,
            total_revenue: 0,
            avg_revenue_per_patient: 0,
            status_breakdown: {
              입원: 0,
              외래: 0,
              낮병동: 0,
              전화FU: 0
            }
          });
        }

        const stats = managerMap.get(managerId)!;
        stats.total_patients += 1;
        stats.total_revenue += patient.payment_amount || 0;
      });

      // 상태별 집계
      dailyStatuses?.forEach(status => {
        const patient = patients?.find(p => p.id === status.patient_id);
        if (!patient) return;

        const stats = managerMap.get(patient.assigned_manager);
        if (!stats) return;

        if (status.status_type === '입원' || status.status_type === '재원') {
          stats.status_breakdown.입원 += 1;
        } else if (status.status_type === '외래') {
          stats.status_breakdown.외래 += 1;
        } else if (status.status_type === '낮병동') {
          stats.status_breakdown.낮병동 += 1;
        } else if (status.status_type === '전화F/U') {
          stats.status_breakdown.전화FU += 1;
        }
      });

      // 평균 계산
      const statsArray = Array.from(managerMap.values()).map(stats => ({
        ...stats,
        avg_revenue_per_patient: stats.total_patients > 0 
          ? Math.round(stats.total_revenue / stats.total_patients) 
          : 0
      }));

      // 전체 통계 계산
      const totals = statsArray.reduce((acc, stats) => ({
        totalPatients: acc.totalPatients + stats.total_patients,
        totalRevenue: acc.totalRevenue + stats.total_revenue,
        avgRevenuePerPatient: 0
      }), { totalPatients: 0, totalRevenue: 0, avgRevenuePerPatient: 0 });

      totals.avgRevenuePerPatient = totals.totalPatients > 0 
        ? Math.round(totals.totalRevenue / totals.totalPatients) 
        : 0;

      setManagerStats(statsArray);
      setTotalStats(totals);

    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: "오류",
        description: "통계 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
      options.push({ value, label });
    }
    
    return options;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
          <h1 className="text-3xl font-bold text-gray-900">통계 관리</h1>
          <p className="text-gray-600 mt-1">매출 분석</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {generateMonthOptions().map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 전체 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 관리 환자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalPatients}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 객단가</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.avgRevenuePerPatient)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 실장별 통계 */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {managerStats.map((stats) => (
            <Card key={stats.manager_id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary to-medical-accent text-white">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {stats.manager_name}
                </CardTitle>
                <CardDescription className="text-primary-light">
                  관리 환자 {stats.total_patients}명
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">총 매출</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(stats.total_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">평균 객단가</span>
                    <span className="text-lg font-bold text-medical-accent">
                      {formatCurrency(stats.avg_revenue_per_patient)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">상태별 분포</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm text-gray-600">입원</span>
                      <span className="text-sm font-semibold text-blue-700">
                        {stats.status_breakdown.입원}회
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-600">외래</span>
                      <span className="text-sm font-semibold text-green-700">
                        {stats.status_breakdown.외래}회
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm text-gray-600">낮병동</span>
                      <span className="text-sm font-semibold text-purple-700">
                        {stats.status_breakdown.낮병동}회
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-orange-50 rounded">
                      <span className="text-sm text-gray-600">전화F/U</span>
                      <span className="text-sm font-semibold text-orange-700">
                        {stats.status_breakdown.전화FU}회
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}