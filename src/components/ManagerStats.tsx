import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Users, TrendingUp, DollarSign, AlertCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

interface ManagerStat {
  manager_id: string;
  manager_name: string;
  manager_email: string;
  total_patients: number;
  new_patients_this_month: number;
  visits_this_week: number;
  total_revenue: number;
  outstanding_balance: number;
  last_patient_added: string | null;
}

export function ManagerStats() {
  const { currentBranch } = useBranchFilter();
  const { toast } = useToast();
  const [stats, setStats] = useState<ManagerStat[]>([]);
  const [filteredStats, setFilteredStats] = useState<ManagerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStats = async () => {
    try {
      let query = supabase
        .from('manager_patient_stats')
        .select('*');
      
      // 현재 지점 필터 적용 - manager_patient_stats view에 branch 컬럼이 있다고 가정
      // view를 수정해야 할 수도 있음
      
      const { data, error } = await query;

      if (error) throw error;
      setStats(data || []);
      setFilteredStats(data || []);
    } catch (error: any) {
      console.error('통계 조회 실패:', error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "매니저 통계를 불러오는데 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentBranch]); // currentBranch 의존성 추가

  useEffect(() => {
    if (searchTerm) {
      const filtered = stats.filter(
        (stat) =>
          stat.manager_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stat.manager_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStats(filtered);
    } else {
      setFilteredStats(stats);
    }
  }, [searchTerm, stats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 검색 필터 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="매니저 이름 또는 이메일로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 전체 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매니저</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStats.length}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 환자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStats.reduce((sum, stat) => sum + stat.total_patients, 0)}명
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 신규</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStats.reduce((sum, stat) => sum + stat.new_patients_this_month, 0)}명
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수익</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredStats.reduce((sum, stat) => sum + stat.total_revenue, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 매니저별 상세 통계 */}
      <div className="space-y-4">
        {filteredStats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 매니저가 없습니다.'}
          </div>
        ) : (
          filteredStats.map((stat) => (
            <Card key={stat.manager_id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{stat.manager_name}</h3>
                    <p className="text-sm text-muted-foreground">{stat.manager_email}</p>
                  </div>
                  <Badge variant={stat.total_patients > 10 ? "default" : "secondary"}>
                    {stat.total_patients > 10 ? '활발' : '보통'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stat.total_patients}</div>
                    <div className="text-xs text-muted-foreground">총 환자</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stat.new_patients_this_month}</div>
                    <div className="text-xs text-muted-foreground">이번 달 신규</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stat.visits_this_week}</div>
                    <div className="text-xs text-muted-foreground">이번 주 방문</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-600">
                      {formatCurrency(stat.total_revenue)}
                    </div>
                    <div className="text-xs text-muted-foreground">총 수익</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(stat.outstanding_balance)}
                    </div>
                    <div className="text-xs text-muted-foreground">미수금</div>
                  </div>
                </div>

                {stat.last_patient_added && (
                  <div className="text-sm text-muted-foreground">
                    마지막 환자 등록: {format(new Date(stat.last_patient_added), 'yyyy-MM-dd')}
                  </div>
                )}

                {stat.outstanding_balance > 0 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>미수금이 있습니다.</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}