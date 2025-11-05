import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBranchFilter } from "@/hooks/useBranchFilter";

type PeriodType = "1" | "3" | "6" | "9" | "12";

interface DiagnosisStats {
  diagnosis: string;
  visit_type: string;
  count: number;
  percentage: number;
}

interface HospitalStats {
  hospital: string;
  count: number;
  percentage: number;
}

interface InsuranceStats {
  insurance_type: string;
  count: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function MarketingStatistics() {
  const { applyBranchFilter } = useBranchFilter();
  const [period, setPeriod] = useState<PeriodType>("3");
  const [diagnosisStats, setDiagnosisStats] = useState<DiagnosisStats[]>([]);
  const [hospitalStats, setHospitalStats] = useState<HospitalStats[]>([]);
  const [insuranceStats, setInsuranceStats] = useState<InsuranceStats[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(period));

      // 진단명별 방문유형 통계
      let diagnosisQuery = supabase
        .from('patients')
        .select('diagnosis_detail, visit_type')
        .gte('first_visit_date', monthsAgo.toISOString().split('T')[0])
        .not('diagnosis_detail', 'is', null)
        .not('visit_type', 'is', null);
      
      // 지점 필터 적용
      diagnosisQuery = applyBranchFilter(diagnosisQuery);
      
      const { data: diagnosisData, error: diagnosisError } = await diagnosisQuery;

      if (diagnosisError) throw diagnosisError;

      // 진단명별 방문유형 집계
      const diagnosisMap = new Map<string, Map<string, number>>();
      const diagnosisTotals = new Map<string, number>();
      
      diagnosisData?.forEach(patient => {
        const diagnosis = patient.diagnosis_detail || '미분류';
        const visitType = patient.visit_type || '미분류';
        
        if (!diagnosisMap.has(diagnosis)) {
          diagnosisMap.set(diagnosis, new Map());
          diagnosisTotals.set(diagnosis, 0);
        }
        
        const visitMap = diagnosisMap.get(diagnosis)!;
        visitMap.set(visitType, (visitMap.get(visitType) || 0) + 1);
        diagnosisTotals.set(diagnosis, diagnosisTotals.get(diagnosis)! + 1);
      });

      const diagnosisResult: DiagnosisStats[] = [];
      diagnosisMap.forEach((visitMap, diagnosis) => {
        const total = diagnosisTotals.get(diagnosis) || 1;
        visitMap.forEach((count, visitType) => {
          diagnosisResult.push({
            diagnosis,
            visit_type: visitType,
            count,
            percentage: Math.round((count / total) * 100)
          });
        });
      });

      setDiagnosisStats(diagnosisResult);

      // 이전병원 통계
      let hospitalQuery = supabase
        .from('patients')
        .select('hospital_category')
        .gte('first_visit_date', monthsAgo.toISOString().split('T')[0])
        .not('hospital_category', 'is', null);
      
      // 지점 필터 적용
      hospitalQuery = applyBranchFilter(hospitalQuery);
      
      const { data: hospitalData, error: hospitalError } = await hospitalQuery;

      if (hospitalError) throw hospitalError;

      const hospitalMap = new Map<string, number>();
      hospitalData?.forEach(patient => {
        const hospital = patient.hospital_category || '미기재';
        hospitalMap.set(hospital, (hospitalMap.get(hospital) || 0) + 1);
      });

      const hospitalTotal = hospitalData?.length || 1;
      const hospitalResult: HospitalStats[] = Array.from(hospitalMap.entries())
        .map(([hospital, count]) => ({
          hospital,
          count,
          percentage: Math.round((count / hospitalTotal) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setHospitalStats(hospitalResult);

      // 보험유형 통계
      let insuranceQuery = supabase
        .from('patients')
        .select('insurance_type')
        .gte('first_visit_date', monthsAgo.toISOString().split('T')[0]);
      
      // 지점 필터 적용
      insuranceQuery = applyBranchFilter(insuranceQuery);
      
      const { data: insuranceData, error: insuranceError } = await insuranceQuery;

      if (insuranceError) throw insuranceError;

      const insuranceMap = new Map<string, number>();
      insuranceData?.forEach(patient => {
        const insurance = patient.insurance_type || '미기재';
        insuranceMap.set(insurance, (insuranceMap.get(insurance) || 0) + 1);
      });

      const insuranceTotal = insuranceData?.length || 1;
      const insuranceResult: InsuranceStats[] = Array.from(insuranceMap.entries())
        .map(([insurance_type, count]) => ({
          insurance_type,
          count,
          percentage: Math.round((count / insuranceTotal) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      setInsuranceStats(insuranceResult);
      setTotalPatients(insuranceTotal);

    } catch (error) {
      console.error('통계 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 진단명별로 차트 데이터 생성
  const getDiagnosisChartData = () => {
    const diagnosisGroups = new Map<string, any>();
    
    diagnosisStats.forEach(stat => {
      if (!diagnosisGroups.has(stat.diagnosis)) {
        diagnosisGroups.set(stat.diagnosis, { diagnosis: stat.diagnosis });
      }
      diagnosisGroups.get(stat.diagnosis)![stat.visit_type] = stat.count;
    });

    return Array.from(diagnosisGroups.values());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">마케팅 통계</h1>
          <p className="text-muted-foreground mt-1">진단명, 이전병원, 보험 분석</p>
        </div>
        
        <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="기간 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">최근 1개월</SelectItem>
            <SelectItem value="3">최근 3개월</SelectItem>
            <SelectItem value="6">최근 6개월</SelectItem>
            <SelectItem value="9">최근 9개월</SelectItem>
            <SelectItem value="12">최근 1년</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>분석 기간 환자 수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">{totalPatients}명</div>
        </CardContent>
      </Card>

      <Tabs defaultValue="diagnosis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="diagnosis">진단명별 방문유형</TabsTrigger>
          <TabsTrigger value="hospital">이전병원</TabsTrigger>
          <TabsTrigger value="insurance">보험유형</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>진단명별 방문유형 비율</CardTitle>
              <CardDescription>등록된 환자 기준 진단명별 외래/입원/낮병동 비율</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">데이터 로딩 중...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getDiagnosisChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="diagnosis" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="외래" fill="#0088FE" />
                    <Bar dataKey="입원" fill="#00C49F" />
                    <Bar dataKey="낮병동" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>진단명별 상세 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(new Set(diagnosisStats.map(s => s.diagnosis))).map(diagnosis => (
                  <div key={diagnosis} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{diagnosis}</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {diagnosisStats
                        .filter(s => s.diagnosis === diagnosis)
                        .map(stat => (
                          <div key={`${diagnosis}-${stat.visit_type}`} className="text-sm">
                            <div className="text-muted-foreground">{stat.visit_type}</div>
                            <div className="font-medium">{stat.count}명 ({stat.percentage}%)</div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hospital" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>이전병원 Top 10</CardTitle>
              <CardDescription>환자 유입이 많은 병원 순위</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">데이터 로딩 중...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={hospitalStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="hospital" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884D8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>이전병원 상세 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hospitalStats.map((stat, index) => (
                  <div key={stat.hospital} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-lg w-8">{index + 1}</div>
                      <div className="font-medium">{stat.hospital}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{stat.count}명</div>
                      <div className="text-sm text-muted-foreground">{stat.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>보험유형 분포</CardTitle>
                <CardDescription>환자들의 보험 가입 현황</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">데이터 로딩 중...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={insuranceStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.insurance_type} (${entry.percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {insuranceStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>보험유형 상세</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insuranceStats.map((stat, index) => (
                    <div key={stat.insurance_type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="font-medium">{stat.insurance_type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{stat.count}명</div>
                        <div className="text-sm text-muted-foreground">{stat.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}