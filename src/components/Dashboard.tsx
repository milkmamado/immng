import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity, 
  AlertCircle,
  Clock,
  Heart,
  UserPlus,
  CalendarDays
} from "lucide-react";

interface DashboardStats {
  totalPatients: number;
  newPatientsThisMonth: number;
  totalRevenue: number;
  outstandingBalance: number;
  activePatients: number;
}

interface RecentPatient {
  id: string;
  patient_number: string;
  name: string;
  age?: number;
  cancer_type?: string;
  cancer_stage?: string;
  visit_type?: string;
  first_visit_date?: string;
  outstanding_balance?: number;
  created_at: string;
}

export function Dashboard() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    newPatientsThisMonth: 0,
    totalRevenue: 0,
    outstandingBalance: 0,
    activePatients: 0
  });
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);

  const fetchDashboardData = async () => {
    try {
      // 전체 환자 수 및 기본 통계
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, created_at, visit_type');

      if (patientsError) throw patientsError;

      // 이번 달 신규 환자 수 계산
      const now = new Date();
      const thisMonth = patients?.filter(p => {
        const created = new Date(p.created_at);
        return created.getMonth() === now.getMonth() && 
               created.getFullYear() === now.getFullYear();
      }).length || 0;

      // 활성 환자 수 (입원 환자)
      const activePatients = patients?.filter(p => p.visit_type === '입원').length || 0;

      // 패키지 관련 수익 통계
      const { data: packages, error: packagesError } = await supabase
        .from('packages')
        .select('total_cost, outstanding_balance');

      if (packagesError && packagesError.code !== 'PGRST116') {
        console.error('패키지 통계 조회 실패:', packagesError);
      }

      const totalRevenue = packages?.reduce((sum, pkg) => sum + (pkg.total_cost || 0), 0) || 0;
      const outstandingBalance = packages?.reduce((sum, pkg) => sum + (pkg.outstanding_balance || 0), 0) || 0;

      setStats({
        totalPatients: patients?.length || 0,
        newPatientsThisMonth: thisMonth,
        totalRevenue,
        outstandingBalance,
        activePatients
      });

      // 최근 환자 목록 (patient_summary 뷰 사용)
      const { data: recentData, error: recentError } = await supabase
        .from('patient_summary')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError && recentError.code !== 'PGRST116') {
        console.error('최근 환자 조회 실패:', recentError);
      } else {
        setRecentPatients(recentData || []);
      }

    } catch (error: any) {
      console.error('대시보드 데이터 조회 실패:', error);
      toast({
        variant: "destructive",
        title: "데이터 로드 오류",
        description: "대시보드 데이터를 불러오는데 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (visitType?: string, outstandingBalance?: number) => {
    if (outstandingBalance && outstandingBalance > 0) {
      return "bg-status-warning/10 text-status-warning border-status-warning/20";
    }
    switch (visitType) {
      case "입원": return "bg-status-critical/10 text-status-critical border-status-critical/20";
      case "외래": return "bg-status-stable/10 text-status-stable border-status-stable/20";
      case "응급": return "bg-status-improving/10 text-status-improving border-status-improving/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusText = (visitType?: string, outstandingBalance?: number) => {
    if (outstandingBalance && outstandingBalance > 0) {
      return "미납";
    }
    return visitType || "외래";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
            <p className="text-muted-foreground mt-1">데이터를 불러오는 중...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: "총 환자 수",
      value: stats.totalPatients.toString(),
      change: `+${stats.newPatientsThisMonth} (이번 달)`,
      icon: Users,
      gradient: "from-primary to-primary-light"
    },
    {
      title: "활성 환자",
      value: stats.activePatients.toString(),
      change: "입원 환자",
      icon: Activity,
      gradient: "from-medical-accent to-medical-accent/80"
    },
    {
      title: "총 수익",
      value: `₩${stats.totalRevenue.toLocaleString()}`,
      change: "누적 매출",
      icon: DollarSign,
      gradient: "from-status-stable to-status-improving"
    },
    {
      title: "미납 금액",
      value: `₩${stats.outstandingBalance.toLocaleString()}`,
      change: "수금 필요",
      icon: AlertCircle,
      gradient: "from-status-warning to-status-critical"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'master' ? '전체 시스템' : '담당 환자'} 현황을 확인하세요
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate('/patients/new')}
          >
            <UserPlus className="h-4 w-4" />
            신규 환자 등록
          </Button>
          <Button 
            className="gap-2"
            onClick={() => navigate('/patients')}
          >
            <Users className="h-4 w-4" />
            환자 관리
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              최근 등록 환자
            </CardTitle>
            <CardDescription>
              최근에 등록된 환자들의 현황을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>등록된 환자가 없습니다.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/patients/new')}
                  >
                    첫 환자 등록하기
                  </Button>
                </div>
              ) : (
                recentPatients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Heart className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {patient.name} {patient.age && `(${patient.age}세)`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {patient.cancer_type ? 
                            `${patient.cancer_type} ${patient.cancer_stage || ''}` : 
                            patient.patient_number
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(patient.visit_type, patient.outstanding_balance)}>
                        {getStatusText(patient.visit_type, patient.outstanding_balance)}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {patient.first_visit_date ? 
                          new Date(patient.first_visit_date).toLocaleDateString('ko-KR') :
                          new Date(patient.created_at).toLocaleDateString('ko-KR')
                        }
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              빠른 작업
            </CardTitle>
            <CardDescription>
              자주 사용하는 기능들에 빠르게 접근하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-12"
                onClick={() => navigate('/patients/new')}
              >
                <UserPlus className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">신규 환자 등록</div>
                  <div className="text-sm text-muted-foreground">새로운 환자 정보 입력</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-12"
                onClick={() => navigate('/patients')}
              >
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">환자 관리</div>
                  <div className="text-sm text-muted-foreground">환자 검색 및 관리</div>
                </div>
              </Button>

              {userRole === 'master' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => navigate('/account-management')}
                >
                  <Users className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">계정 관리</div>
                    <div className="text-sm text-muted-foreground">사용자 승인 및 권한 관리</div>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      {stats.outstandingBalance > 0 && (
        <Card className="border-status-warning/20 bg-status-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-status-warning">
              <AlertCircle className="h-5 w-5" />
              수금 알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">미납 금액이 있습니다</p>
                <p className="text-sm text-muted-foreground">
                  총 {stats.outstandingBalance.toLocaleString()}원의 미수금이 발생했습니다.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/patients')}
              >
                확인하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}