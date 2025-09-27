import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, User, Calendar, Package, History, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Patient {
  id: string;
  patient_number: string;
  name: string;
  phone?: string;
  age?: number;
  gender?: string;
  first_visit_date?: string;
  visit_type?: string;
  assigned_manager: string;
  created_at: string;
  manager_name?: string;
  total_cost?: number;
  outstanding_balance?: number;
  cancer_type?: string;
  cancer_stage?: string;
  package_type?: string;
}

export default function PatientManagement() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
      setFilteredPatients(data || []);
    } catch (error: any) {
      console.error('환자 조회 실패:', error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "환자 정보를 불러오는데 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient => 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const getVisitTypeBadge = (visitType?: string) => {
    if (!visitType) return null;
    
    const variants = {
      '입원': 'destructive',
      '외래': 'secondary',
      '응급': 'default'
    } as const;

    return (
      <Badge variant={variants[visitType as keyof typeof variants] || 'outline'}>
        {visitType}
      </Badge>
    );
  };

  const getBalanceStatus = (balance?: number) => {
    if (!balance || balance === 0) {
      return <Badge variant="secondary">완납</Badge>;
    }
    if (balance > 0) {
      return <Badge variant="destructive">미납 {balance.toLocaleString()}원</Badge>;
    }
    return null;
  };

  const handleNewPatient = () => {
    navigate('/patients/new');
  };

  const handlePatientDetail = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const handleQuickReadmission = async (patient: Patient) => {
    // 재입원 처리 로직 - 기존 정보를 복사해서 새로운 입원 등록
    navigate(`/patients/readmission/${patient.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg">환자 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <User className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">환자 관리</h1>
            <p className="text-muted-foreground">
              환자 등록, 검색, 이력 관리를 통합적으로 처리합니다.
            </p>
          </div>
        </div>
        <Button onClick={handleNewPatient} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          신규 환자 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">총 환자</p>
                <p className="text-2xl font-bold">{patients.length}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">이번 달 신규</p>
                <p className="text-2xl font-bold">
                  {patients.filter(p => {
                    const created = new Date(p.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && 
                           created.getFullYear() === now.getFullYear();
                  }).length}명
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">미납 환자</p>
                <p className="text-2xl font-bold">
                  {patients.filter(p => p.outstanding_balance && p.outstanding_balance > 0).length}명
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">입원 환자</p>
                <p className="text-2xl font-bold">
                  {patients.filter(p => p.visit_type === '입원').length}명
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="환자명, 환자번호, 전화번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 환자 목록 */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                {searchTerm ? '검색 결과가 없습니다.' : '등록된 환자가 없습니다.'}
              </p>
              {!searchTerm && (
                <Button onClick={handleNewPatient} className="mt-4">
                  첫 환자 등록하기
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <h3 
                          className="text-lg font-semibold hover:text-primary transition-colors"
                          onClick={() => handlePatientDetail(patient.id)}
                        >
                          {patient.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {patient.patient_number}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {getVisitTypeBadge(patient.visit_type)}
                        {getBalanceStatus(patient.outstanding_balance)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">담당 매니저</p>
                        <p className="font-medium">{patient.manager_name || '미지정'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">첫 방문일</p>
                        <p className="font-medium">
                          {patient.first_visit_date ? 
                            format(new Date(patient.first_visit_date), 'yyyy-MM-dd') : 
                            '미등록'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">진단명</p>
                        <p className="font-medium">
                          {patient.cancer_type ? 
                            `${patient.cancer_type} ${patient.cancer_stage || ''}` : 
                            '미등록'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">연락처</p>
                        <p className="font-medium">{patient.phone || '미등록'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePatientDetail(patient.id)}
                      className="flex items-center gap-2"
                    >
                      <History className="w-4 h-4" />
                      상세보기
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleQuickReadmission(patient)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      재입원
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}