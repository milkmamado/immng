import { useState, useEffect } from 'react';
import { useInsuranceTypeOptions, usePatientStatusOptions, useCurrentUserName } from '@/hooks/useOptionsData';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RefreshCw, Package as PackageIcon, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { isShortTermTreatmentPatient } from "@/utils/patientStatusUtils";

interface Patient {
  id: string;
  name: string;
  customer_number?: string;
  resident_number_masked?: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  last_visit_date?: string;
  inflow_status?: string;
  inflow_date?: string;
  consultation_date?: string;
  visit_type?: string;
  visit_motivation?: string;
  diagnosis_category?: string;
  diagnosis_detail?: string;
  counselor?: string;
  hospital_category?: string;
  hospital_branch?: string;
  diet_info?: string;
  manager_name?: string;
  korean_doctor?: string;
  western_doctor?: string;
  insurance_type?: string;
  hospital_treatment?: string;
  examination_schedule?: string;
  treatment_plan?: string;
  monthly_avg_inpatient_days?: number;
  monthly_avg_outpatient_days?: number;
  payment_amount?: number;
  crm_memo?: string;
  special_note_1?: string;
  special_note_2?: string;
  treatment_memo_1?: string;
  treatment_memo_2?: string;
  patient_or_guardian?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  management_status?: string;
  memo1?: string;
  created_at: string;
}

interface Option {
  id: string;
  name: string;
}

interface PatientStatusOption extends Option {
  exclude_from_daily_tracking: boolean;
}

interface PackageTransaction {
  id: string;
  patient_id: string;
  customer_number?: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  count: number;
  note?: string;
  date_from?: string;
  date_to?: string;
  created_at: string;
}

interface PatientDetailModalProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientUpdate?: (updatedPatient: Patient) => void;
  viewMode?: 'full' | 'treatment-only';
}

export function PatientDetailModal({
  patient,
  open,
  onOpenChange,
  onPatientUpdate,
  viewMode: initialViewMode = 'full'
}: PatientDetailModalProps) {
  const { userRole } = useAuth();
  const { toast } = useToast();
  
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'treatment-only'>(initialViewMode);
  const [editingFields, setEditingFields] = useState<Record<string, any>>({});
  
  // 옵션 데이터 - React Query 캐시 사용
  const { data: insuranceTypeOptions = [] } = useInsuranceTypeOptions();
  const { data: patientStatusOptions = [] } = usePatientStatusOptions();
  const { data: currentUserName = '' } = useCurrentUserName();
  const [packageTransactions, setPackageTransactions] = useState<PackageTransaction[]>([]);
  const [syncingPackage, setSyncingPackage] = useState(false);

  useEffect(() => {
    if (patient && open) {
      setSelectedPatientDetail(patient);
      setViewMode(initialViewMode);
      setEditingFields({});
      fetchOptions();
      fetchCurrentUserName();
      fetchPackageData(patient.id);
    }
  }, [patient, open, initialViewMode]);

  const fetchOptions = async () => {
    try {
      const [insurance, patientStatus] = await Promise.all([
        supabase.from('insurance_type_options').select('*').order('name'),
        supabase.from('patient_status_options').select('*').order('name')
      ]);

      if (insurance.data) setInsuranceTypeOptions(insurance.data);
      if (patientStatus.data) setPatientStatusOptions(patientStatus.data);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchCurrentUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCurrentUserName(profile.name);
        }
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchPackageData = async (patientId: string) => {
    try {
      const { data: transactions } = await supabase
        .from('package_transactions')
        .select('*')
        .eq('patient_id', patientId)
        .order('transaction_date', { ascending: false });

      setPackageTransactions(transactions || []);
    } catch (error) {
      console.error('Error fetching package data:', error);
    }
  };

  const updateEditingField = (field: string, value: any) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
    setSelectedPatientDetail(prev => prev ? { ...prev, [field]: value } : null);
  };

  const saveAllEditingFields = async () => {
    if (!selectedPatientDetail || Object.keys(editingFields).length === 0) return;

    if (userRole === 'admin') {
      toast({
        title: "권한 없음",
        description: "관리자는 환자 정보를 수정할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('patients')
        .update(editingFields)
        .eq('id', selectedPatientDetail.id);

      if (error) throw error;

      const { data: updatedPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', selectedPatientDetail.id)
        .single();

      if (updatedPatient) {
        setSelectedPatientDetail(updatedPatient);
        onPatientUpdate?.(updatedPatient);
      }

      setEditingFields({});

      toast({
        title: "✅ 저장 완료",
        description: "환자 정보가 저장되었습니다.",
      });
    } catch (error) {
      console.error('Error updating patient fields:', error);
      toast({
        title: "오류",
        description: "정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setSelectedPatientDetail(null);
    setViewMode('full');
    setEditingFields({});
    setPackageTransactions([]);
    onOpenChange(false);
  };

  const handleSyncPackage = async () => {
    if (!selectedPatientDetail?.customer_number) {
      toast({
        title: "동기화 불가",
        description: "고객번호가 없어 패키지 정보를 동기화할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setSyncingPackage(true);
    
    try {
      const script = `javascript:(function(){
        try {
          var customerNumber = '${selectedPatientDetail.customer_number}';
          if (typeof window.extractPackageData === 'function') {
            window.extractPackageData(customerNumber);
          } else {
            alert('CRM 페이지에서 북마클릿을 먼저 실행해주세요.');
          }
        } catch(e) { alert('오류: ' + e.message); }
      })();`;
      
      toast({
        title: "📋 북마클릿 코드 복사됨",
        description: "CRM 페이지에서 북마클릿을 실행한 후 다시 최신화를 눌러주세요.",
      });
      
      navigator.clipboard.writeText(script);
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "동기화 실패",
        description: "패키지 정보 동기화에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setSyncingPackage(false);
    }
  };

  const handleDeletePackageData = async () => {
    if (!selectedPatientDetail) return;
    
    if (!confirm('패키지 거래내역을 모두 삭제하시겠습니까?')) return;
    
    try {
      await supabase
        .from('package_transactions')
        .delete()
        .eq('patient_id', selectedPatientDetail.id);
      
      await supabase
        .from('package_management')
        .delete()
        .eq('patient_id', selectedPatientDetail.id);
      
      setPackageTransactions([]);
      
      toast({
        title: "삭제 완료",
        description: "패키지 거래내역이 삭제되었습니다.",
      });
    } catch (error) {
      console.error('Error deleting package data:', error);
      toast({
        title: "삭제 실패",
        description: "패키지 거래내역 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRevenueData = async (type: 'inpatient' | 'outpatient') => {
    if (!selectedPatientDetail) return;
    
    const typeName = type === 'inpatient' ? '입원' : '외래';
    if (!confirm(`${typeName} 매출 데이터를 모두 삭제하시겠습니까?`)) return;
    
    try {
      await supabase
        .from('package_transactions')
        .delete()
        .eq('patient_id', selectedPatientDetail.id)
        .eq('transaction_type', `${type}_revenue`);
      
      fetchPackageData(selectedPatientDetail.id);
      
      toast({
        title: "삭제 완료",
        description: `${typeName} 매출 데이터가 삭제되었습니다.`,
      });
    } catch (error) {
      console.error('Error deleting revenue data:', error);
      toast({
        title: "삭제 실패",
        description: "데이터 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSingleTransaction = async (transactionId: string, type: string) => {
    if (!confirm('이 거래내역을 삭제하시겠습니까?')) return;
    
    try {
      await supabase
        .from('package_transactions')
        .delete()
        .eq('id', transactionId);
      
      if (selectedPatientDetail) {
        fetchPackageData(selectedPatientDetail.id);
      }
      
      toast({
        title: "삭제 완료",
        description: "거래내역이 삭제되었습니다.",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "삭제 실패",
        description: "거래내역 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const renderTreatmentManagement = () => {
    const depositIncome = packageTransactions.filter(t => t.transaction_type === 'deposit_in');
    const depositOut = packageTransactions.filter(t => t.transaction_type === 'deposit_out');
    const rewardIncome = packageTransactions.filter(t => t.transaction_type === 'reward_in');
    const rewardOut = packageTransactions.filter(t => t.transaction_type === 'reward_out');
    const countIn = packageTransactions.filter(t => t.transaction_type === 'count_in');
    const countOut = packageTransactions.filter(t => t.transaction_type === 'count_out');

    const formatDate = (dateStr: string | null | undefined): string => {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return '-';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">패키지 관리</h3>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSyncPackage}
              disabled={syncingPackage || !selectedPatientDetail?.customer_number}
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncingPackage ? 'animate-spin' : ''}`} />
              최신화
            </Button>
            <Button
              onClick={handleDeletePackageData}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              내역삭제
            </Button>
          </div>
        </div>

        {!selectedPatientDetail?.customer_number ? (
          <div className="text-center py-8 text-muted-foreground">
            고객번호가 없어 패키지 정보를 가져올 수 없습니다.
          </div>
        ) : packageTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            최신화 버튼을 클릭하여 CRM에서 패키지 정보를 가져오세요.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">예치금</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">입금:</span>
                    <span className="font-semibold">{depositIncome.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">사용:</span>
                    <span className="text-red-600">{depositOut.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-semibold">잔액:</span>
                    <span className="text-lg font-bold text-primary">
                      {(depositIncome.reduce((sum, t) => sum + t.amount, 0) - depositOut.reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}원
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">적립금</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">입금:</span>
                    <span className="font-semibold">{rewardIncome.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">사용:</span>
                    <span className="text-red-600">{rewardOut.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-semibold">잔액:</span>
                    <span className="text-lg font-bold text-primary">
                      {(rewardIncome.reduce((sum, t) => sum + t.amount, 0) - rewardOut.reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}원
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">횟수</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">입력:</span>
                    <span className="font-semibold">{countIn.reduce((sum, t) => sum + t.count, 0)}회</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">사용:</span>
                    <span className="text-red-600">{countOut.reduce((sum, t) => sum + t.count, 0)}회</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-semibold">잔여:</span>
                    <span className="text-lg font-bold text-primary">
                      {countIn.reduce((sum, t) => sum + t.count, 0) - countOut.reduce((sum, t) => sum + t.count, 0)}회
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 입원 매출 */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">입원 매출 관리</h3>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => handleDeleteRevenueData('inpatient')}
                  disabled={packageTransactions.filter(t => t.transaction_type === 'inpatient_revenue').length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  데이터 삭제
                </Button>
              </div>
              
              {packageTransactions.filter(t => t.transaction_type === 'inpatient_revenue').length > 0 ? (
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>수납일자</TableHead>
                        <TableHead className="text-right">총진료비</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packageTransactions
                        .filter(t => t.transaction_type === 'inpatient_revenue')
                        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                        .map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{formatDate(t.transaction_date)}</TableCell>
                            <TableCell className="text-right font-semibold">{t.amount.toLocaleString()}원</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSingleTransaction(t.id, 'inpatient');
                                }}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border rounded-md bg-muted/30">
                  입원 매출 데이터가 없습니다.
                </div>
              )}
            </div>

            {/* 외래 매출 */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">외래 매출 관리</h3>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => handleDeleteRevenueData('outpatient')}
                  disabled={packageTransactions.filter(t => t.transaction_type === 'outpatient_revenue').length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  데이터 삭제
                </Button>
              </div>
              
              {packageTransactions.filter(t => t.transaction_type === 'outpatient_revenue').length > 0 ? (
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>수납일자</TableHead>
                        <TableHead className="text-right">총진료비</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packageTransactions
                        .filter(t => t.transaction_type === 'outpatient_revenue')
                        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                        .map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{formatDate(t.transaction_date)}</TableCell>
                            <TableCell className="text-right font-semibold">{t.amount.toLocaleString()}원</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSingleTransaction(t.id, 'outpatient');
                                }}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border rounded-md bg-muted/30">
                  외래 매출 데이터가 없습니다.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  if (!selectedPatientDetail) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedPatientDetail?.name} - {viewMode === 'full' ? '환자 상세정보' : '패키지 관리'}
          </DialogTitle>
        </DialogHeader>
        
        {viewMode === 'treatment-only' ? (
          <div className="mt-4">
            {renderTreatmentManagement()}
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* API 자동입력 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="text-lg font-semibold">API 자동입력 정보</h3>
                <Badge variant="outline">자동</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label>고객명 *</Label>
                  <Input value={selectedPatientDetail?.name || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>고객번호</Label>
                  <Input value={selectedPatientDetail?.customer_number || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>주민번호</Label>
                  <Input value={selectedPatientDetail?.resident_number_masked || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>휴대폰번호</Label>
                  <Input value={selectedPatientDetail?.phone || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>성별</Label>
                  <Input value={selectedPatientDetail?.gender || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>나이(만)</Label>
                  <Input value={selectedPatientDetail?.age?.toString() || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>내원동기</Label>
                  <Input value={selectedPatientDetail?.visit_motivation || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>진단명</Label>
                  <Input value={selectedPatientDetail?.diagnosis_category || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>진단명 (중분류)</Label>
                  <Input value={selectedPatientDetail?.diagnosis_detail || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>이전병원 (대분류)</Label>
                  <Input value={selectedPatientDetail?.hospital_category || ''} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>이전병원 (중분류)</Label>
                  <Input value={selectedPatientDetail?.hospital_branch || ''} disabled className="bg-muted" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Label>주소</Label>
                  <Input value={selectedPatientDetail?.address || ''} disabled className="bg-muted" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Label>특이사항1</Label>
                  <Textarea value={selectedPatientDetail?.special_note_1 || ''} disabled className="bg-muted" rows={3} />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Label>특이사항2</Label>
                  <Textarea value={selectedPatientDetail?.special_note_2 || ''} disabled className="bg-muted" rows={3} />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Label>진료메모1</Label>
                  <Textarea value={selectedPatientDetail?.treatment_memo_1 || ''} disabled className="bg-muted" rows={3} />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Label>진료메모2</Label>
                  <Textarea value={selectedPatientDetail?.treatment_memo_2 || ''} disabled className="bg-muted" rows={3} />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Label>CRM메모</Label>
                  <Textarea value={selectedPatientDetail?.crm_memo || ''} disabled className="bg-muted" rows={3} />
                </div>
              </div>
            </div>

            {/* 추가 입력 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="text-lg font-semibold">추가 입력 정보</h3>
                <Badge variant="outline">수동입력</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label>환자 or 보호자</Label>
                  <Select
                    value={selectedPatientDetail?.patient_or_guardian || '환자'}
                    onValueChange={(value) => updateEditingField('patient_or_guardian', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-background">
                      <SelectItem value="환자">환자</SelectItem>
                      <SelectItem value="보호자">보호자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>식이</Label>
                  <Input
                    value={selectedPatientDetail?.diet_info || ''}
                    onChange={(e) => updateEditingField('diet_info', e.target.value)}
                    placeholder="식이정보"
                  />
                </div>
                <div>
                  <Label>유입상태 *</Label>
                  <Select
                    value={selectedPatientDetail?.inflow_status || '유입'}
                    onValueChange={(value) => updateEditingField('inflow_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-background">
                      <SelectItem value="유입">유입</SelectItem>
                      <SelectItem value="전화상담">전화상담</SelectItem>
                      <SelectItem value="방문상담">방문상담</SelectItem>
                      <SelectItem value="실패">실패</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>내원형태</Label>
                  <Select
                    value={selectedPatientDetail?.visit_type || ''}
                    onValueChange={(value) => updateEditingField('visit_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-background">
                      <SelectItem value="입원">입원</SelectItem>
                      <SelectItem value="외래">외래</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>보호자 이름</Label>
                  <Input
                    value={selectedPatientDetail?.guardian_name || ''}
                    onChange={(e) => updateEditingField('guardian_name', e.target.value)}
                    placeholder="보호자 이름"
                  />
                </div>
                <div>
                  <Label>보호자 관계</Label>
                  <Input
                    value={selectedPatientDetail?.guardian_relationship || ''}
                    onChange={(e) => updateEditingField('guardian_relationship', e.target.value)}
                    placeholder="보호자 관계"
                  />
                </div>
                <div>
                  <Label>보호자 연락처</Label>
                  <Input
                    value={selectedPatientDetail?.guardian_phone || ''}
                    onChange={(e) => updateEditingField('guardian_phone', e.target.value)}
                    placeholder="보호자 연락처"
                  />
                </div>
                <div>
                  <Label>담당자(상담실장)</Label>
                  <Input
                    value={selectedPatientDetail?.manager_name || currentUserName}
                    disabled
                    className="bg-muted"
                    placeholder="자동입력"
                  />
                </div>
                <div>
                  <Label>한방주치의</Label>
                  <Input
                    value={selectedPatientDetail?.korean_doctor || ''}
                    onChange={(e) => updateEditingField('korean_doctor', e.target.value)}
                    placeholder="한방주치의"
                  />
                </div>
                <div>
                  <Label>양방주치의</Label>
                  <Input
                    value={selectedPatientDetail?.western_doctor || ''}
                    onChange={(e) => updateEditingField('western_doctor', e.target.value)}
                    placeholder="양방주치의"
                  />
                </div>
                <div>
                  <Label htmlFor="consultation_date">상담일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedPatientDetail?.consultation_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedPatientDetail?.consultation_date ? (
                          format(new Date(selectedPatientDetail.consultation_date), "PPP", { locale: ko })
                        ) : (
                          <span>날짜 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100]" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedPatientDetail?.consultation_date ? new Date(selectedPatientDetail.consultation_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const formatted = format(date, 'yyyy-MM-dd');
                            updateEditingField('consultation_date', formatted);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="inflow_date">유입일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedPatientDetail?.inflow_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedPatientDetail?.inflow_date ? (
                          format(new Date(selectedPatientDetail.inflow_date), "PPP", { locale: ko })
                        ) : (
                          <span>날짜 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100]" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedPatientDetail?.inflow_date ? new Date(selectedPatientDetail.inflow_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const formatted = format(date, 'yyyy-MM-dd');
                            updateEditingField('inflow_date', formatted);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>등록일</Label>
                  <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                    <span className="text-sm">
                      {selectedPatientDetail?.created_at 
                        ? new Date(selectedPatientDetail.created_at).toLocaleDateString('ko-KR')
                        : '-'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 정보 입력 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="text-lg font-semibold">상세 정보 입력</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>관리 상태</Label>
                  <Select 
                    value={selectedPatientDetail?.management_status || '관리 중'} 
                    onValueChange={(value) => updateEditingField('management_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="관리 상태를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-background">
                      {(() => {
                        const isShortTerm = isShortTermTreatmentPatient(selectedPatientDetail?.diagnosis_category || '');
                        const availableStatuses = isShortTerm
                          ? patientStatusOptions.filter((option: any) => 
                              option.name === '관리 중' || option.name === '치료종료'
                            )
                          : patientStatusOptions;
                        
                        return availableStatuses.map(option => (
                          <SelectItem key={option.id} value={option.name}>
                            {option.name}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>실비보험 유형</Label>
                  <Select
                    value={selectedPatientDetail?.insurance_type || ''}
                    onValueChange={(value) => updateEditingField('insurance_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-background">
                      {insuranceTypeOptions.map(option => (
                        <SelectItem key={option.id} value={option.name}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>본병원 치료</Label>
                  <Input
                    value={selectedPatientDetail?.hospital_treatment || ''}
                    onChange={(e) => updateEditingField('hospital_treatment', e.target.value)}
                    placeholder="본병원 치료 내용"
                  />
                </div>
                <div>
                  <Label>본병원 검사일정</Label>
                  <Input
                    value={selectedPatientDetail?.examination_schedule || ''}
                    onChange={(e) => updateEditingField('examination_schedule', e.target.value)}
                    placeholder="검사 일정 입력"
                  />
                </div>
                <div>
                  <Label>월평균 입원일수</Label>
                  <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                    <span className="text-sm">
                      {selectedPatientDetail?.monthly_avg_inpatient_days 
                        ? `${selectedPatientDetail.monthly_avg_inpatient_days}일` 
                        : '-'
                      }
                    </span>
                  </div>
                </div>
                <div>
                  <Label>월평균 외래일수</Label>
                  <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                    <span className="text-sm">
                      {selectedPatientDetail?.monthly_avg_outpatient_days 
                        ? `${selectedPatientDetail.monthly_avg_outpatient_days}일` 
                        : '-'
                      }
                    </span>
                  </div>
                </div>
                <div>
                  <Label>수납금액</Label>
                  <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                    <span className="text-sm font-semibold text-primary">
                      {selectedPatientDetail?.payment_amount ? 
                        `${selectedPatientDetail.payment_amount.toLocaleString()}원` : '-'
                      }
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="manager-memo">담당자 메모</Label>
                  <Textarea
                    id="manager-memo"
                    placeholder="담당자 메모를 입력하세요"
                    value={selectedPatientDetail?.memo1 || ''}
                    onChange={(e) => updateEditingField('memo1', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>유입일</Label>
                  <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                    <span className="text-sm">
                      {selectedPatientDetail?.inflow_date 
                        ? new Date(selectedPatientDetail.inflow_date).toLocaleDateString('ko-KR')
                        : '-'
                      }
                    </span>
                  </div>
                </div>
                <div>
                  <Label>마지막내원일</Label>
                  <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                    <span className="text-sm">
                      {selectedPatientDetail?.last_visit_date ? 
                        new Date(selectedPatientDetail.last_visit_date).toLocaleDateString('ko-KR') : '-'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  onClick={saveAllEditingFields}
                  disabled={Object.keys(editingFields).length === 0 || userRole === 'admin'}
                >
                  수정 저장
                </Button>
              </div>
            </div>

            {/* 패키지 관리 섹션 */}
            <div className="border-t pt-6">
              {renderTreatmentManagement()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
