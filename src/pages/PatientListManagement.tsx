import { useState, useEffect } from 'react';
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, RefreshCw, Package as PackageIcon, Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import * as XLSX from 'xlsx';

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
  patient_or_guardian?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  management_status?: string;
  memo1?: string;
  created_at: string;
}

interface TreatmentPlan {
  id: string;
  patient_id: string;
  treatment_detail: string;
  treatment_amount: number;
  is_paid: boolean;
  payment_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface Option {
  id: string;
  name: string;
}

interface PatientStatusOption extends Option {
  exclude_from_daily_tracking: boolean;
}

interface PackageManagement {
  id: string;
  patient_id: string;
  customer_number?: string;
  deposit_total: number;
  deposit_used: number;
  deposit_balance: number;
  reward_total: number;
  reward_used: number;
  reward_balance: number;
  count_total: number;
  count_used: number;
  count_balance: number;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

export default function PatientListManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'treatment-only'>('full');
  const [editingFields, setEditingFields] = useState<Record<string, any>>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');
  
  // 옵션 데이터 state
  const [diagnosisOptions, setDiagnosisOptions] = useState<Option[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<Option[]>([]);
  const [insuranceTypeOptions, setInsuranceTypeOptions] = useState<Option[]>([]);
  const [treatmentDetailOptions, setTreatmentDetailOptions] = useState<Option[]>([]);
  const [patientStatusOptions, setPatientStatusOptions] = useState<PatientStatusOption[]>([]);
  const [packageData, setPackageData] = useState<PackageManagement | null>(null);
  const [packageTransactions, setPackageTransactions] = useState<PackageTransaction[]>([]);
  const [syncingPackage, setSyncingPackage] = useState(false);
  const [uploadingInpatient, setUploadingInpatient] = useState(false);
  const [uploadingOutpatient, setUploadingOutpatient] = useState(false);
  
  const { toast } = useToast();
  const { userRole } = useAuth();

  useEffect(() => {
    fetchPatients();
    fetchOptions();
    fetchCurrentUserName();
    
    // CRM에서 postMessage로 패키지 데이터 수신
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'crm-package-data') {
        handlePackageDataReceived(event.data.data);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.customer_number && patient.customer_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.phone && patient.phone.includes(searchTerm)) ||
      (patient.manager_name && patient.manager_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.western_doctor && patient.western_doctor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.korean_doctor && patient.korean_doctor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.visit_type && patient.visit_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.hospital_category && patient.hospital_category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('inflow_status', '유입')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // 모든 환자의 일별 상태 데이터 가져오기
      const { data: allStatusData } = await supabase
        .from('daily_patient_status')
        .select('patient_id, status_date, status_type')
        .order('status_date', { ascending: false });

      // 각 환자의 마지막 체크 날짜 맵 생성
      const lastCheckMap = new Map<string, string>();
      allStatusData?.forEach(status => {
        if (!lastCheckMap.has(status.patient_id)) {
          lastCheckMap.set(status.patient_id, status.status_date);
        }
      });

      const today = new Date();
      
      // 각 환자의 일별 상태 데이터를 가져와서 통계 계산 및 management_status 자동 업데이트
      const patientsWithStats = await Promise.all(
        (data || []).map(async (patient) => {
          const { data: statusData } = await supabase
            .from('daily_patient_status')
            .select('status_date, status_type')
            .eq('patient_id', patient.id)
            .order('status_date', { ascending: false });

          // 마지막 내원일 (가장 최근 상태 날짜)
          const last_visit_date = statusData && statusData.length > 0 
            ? statusData[0].status_date 
            : null;

          // management_status 자동 업데이트 로직
          const lastCheckDate = lastCheckMap.get(patient.id);
          let daysSinceCheck = 0;

          if (!lastCheckDate) {
            const createdDate = new Date(patient.created_at);
            daysSinceCheck = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          } else {
            const lastDate = new Date(lastCheckDate);
            daysSinceCheck = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          }

          // 최종 상태(사망, 상태악화, 치료종료, 아웃, 아웃위기)는 자동 업데이트하지 않음
          // 사용자가 수동으로 설정한 상태는 유지되어야 함
          const finalStatuses = ['사망', '상태악화', '치료종료', '아웃', '아웃위기'];
          let newManagementStatus = patient.management_status || "관리 중";
          
          if (!finalStatuses.includes(patient.management_status)) {
            // 자동 상태 업데이트 로직 (관리 중만 자동 업데이트)
            if (daysSinceCheck >= 21) {
              newManagementStatus = "아웃";
            } else if (daysSinceCheck >= 14) {
              newManagementStatus = "아웃위기";
            } else {
              newManagementStatus = "관리 중";
            }

            // management_status가 변경되었으면 업데이트
            if (patient.management_status !== newManagementStatus) {
              await supabase
                .from("patients")
                .update({ management_status: newManagementStatus })
                .eq("id", patient.id);
            }
          }

          // 월평균 입원/외래 일수 계산
          let monthly_avg_inpatient_days = 0;
          let monthly_avg_outpatient_days = 0;
          
          if (statusData && statusData.length > 0) {
            // 입원 관련: 입원, 재입원, 낮병동
            const inpatientStatuses = ['입원', '재입원', '낮병동'];
            const inpatientDays = statusData.filter(s => inpatientStatuses.includes(s.status_type));
            
            // 외래 관련: 외래
            const outpatientStatuses = ['외래'];
            const outpatientDays = statusData.filter(s => outpatientStatuses.includes(s.status_type));
            
            // 전체 기간 계산 (첫 기록부터 마지막 기록까지)
            const allRelevantDays = [...inpatientDays, ...outpatientDays];
            if (allRelevantDays.length > 0) {
              const dates = allRelevantDays.map(s => new Date(s.status_date));
              const firstDate = new Date(Math.min(...dates.map(d => d.getTime())));
              const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));
              const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 
                + (lastDate.getMonth() - firstDate.getMonth()) + 1;
              
              monthly_avg_inpatient_days = inpatientDays.length > 0 
                ? Math.round(inpatientDays.length / monthsDiff) 
                : 0;
              monthly_avg_outpatient_days = outpatientDays.length > 0 
                ? Math.round(outpatientDays.length / monthsDiff) 
                : 0;
            }
          }

          return {
            ...patient,
            management_status: newManagementStatus,
            last_visit_date,
            monthly_avg_inpatient_days,
            monthly_avg_outpatient_days
          };
        })
      );

      setPatients(patientsWithStats);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "오류",
        description: "관리 환자 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [diagnosis, hospital, insurance, treatment, patientStatus] = await Promise.all([
        supabase.from('diagnosis_options').select('*').order('name'),
        supabase.from('hospital_options').select('*').order('name'),
        supabase.from('insurance_type_options').select('*').order('name'),
        supabase.from('treatment_detail_options').select('*').order('name'),
        supabase.from('patient_status_options').select('*').order('name')
      ]);

      if (diagnosis.data) setDiagnosisOptions(diagnosis.data);
      if (hospital.data) setHospitalOptions(hospital.data);
      if (insurance.data) setInsuranceTypeOptions(insurance.data);
      if (treatment.data) setTreatmentDetailOptions(treatment.data);
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
      const [summaryResult, transactionsResult] = await Promise.all([
        supabase
          .from('package_management')
          .select('*')
          .eq('patient_id', patientId)
          .maybeSingle(),
        supabase
          .from('package_transactions')
          .select('*')
          .eq('patient_id', patientId)
          .order('transaction_date', { ascending: false })
      ]);

      if (summaryResult.error) throw summaryResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      setPackageData(summaryResult.data);
      setPackageTransactions(transactionsResult.data || []);
      
      console.log('📦 패키지 데이터 로드:', summaryResult.data);
      console.log('📊 거래 내역:', transactionsResult.data);
    } catch (error) {
      console.error('Error fetching package data:', error);
    }
  };

  const handleSyncPackage = () => {
    if (!selectedPatientDetail?.customer_number) {
      toast({
        title: "오류",
        description: "고객번호가 없어 패키지 정보를 가져올 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setSyncingPackage(true);
    
    const data = {
      customerNumber: selectedPatientDetail.customer_number,
      patientId: selectedPatientDetail.id,
      appUrl: window.location.origin + '/patient-list'
    };
    
    // localStorage에도 저장 (북마크릿이 URL 파싱 실패시 폴백용)
    localStorage.setItem('crm_package_search', JSON.stringify(data));
    
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const crmUrl = `http://192.168.1.101/html/MEDI20/main.html#package_data=${encoded}`;
    
    window.open(crmUrl, '_blank');
    
    toast({
      title: "CRM 페이지 열기",
      description: "CRM 패키지 관리 페이지에서 '패키지 연동' 북마크를 클릭하세요.",
    });
    
    // localStorage 결과 체크 시작
    const checkInterval = setInterval(() => {
      const result = localStorage.getItem('crm_package_result');
      if (result) {
        try {
          const packageData = JSON.parse(result);
          localStorage.removeItem('crm_package_result');
          handlePackageDataReceived(packageData);
          clearInterval(checkInterval);
        } catch (e) {
          console.error('localStorage 결과 파싱 오류:', e);
          setSyncingPackage(false);
        }
      }
    }, 1000);
    
    setTimeout(() => {
      clearInterval(checkInterval);
      if (syncingPackage) {
        toast({
          title: "시간 초과",
          description: "패키지 데이터를 받지 못했습니다. 다시 시도해주세요.",
          variant: "destructive",
        });
        setSyncingPackage(false);
      }
    }, 30000);
  };

  const handleDeletePackageData = async () => {
    if (!selectedPatientDetail) return;

    if (!window.confirm('패키지 데이터를 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      // package_transactions 삭제
      const { error: transactionsError } = await supabase
        .from('package_transactions')
        .delete()
        .eq('patient_id', selectedPatientDetail.id);

      if (transactionsError) throw transactionsError;

      // package_management 삭제
      const { error: managementError } = await supabase
        .from('package_management')
        .delete()
        .eq('patient_id', selectedPatientDetail.id);

      if (managementError) throw managementError;

      // 환자의 수납금액도 0으로 초기화
      const { error: paymentResetError } = await supabase
        .from('patients')
        .update({ payment_amount: 0 })
        .eq('id', selectedPatientDetail.id);

      if (paymentResetError) throw paymentResetError;

      // 로컬 상태 초기화
      setPackageData(null);
      setPackageTransactions([]);

      // 환자 목록 새로고침 (통계 반영)
      await fetchPatients();

      // 모달도 업데이트된 정보로 새로고침
      const { data: updatedPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', selectedPatientDetail.id)
        .single();
      
      if (updatedPatient) {
        setSelectedPatientDetail(updatedPatient);
      }

      toast({
        title: "삭제 완료",
        description: "패키지 데이터가 모두 삭제되었습니다. 수납금액도 0으로 초기화되었습니다.",
      });
    } catch (error) {
      console.error('Error deleting package data:', error);
      toast({
        title: "오류",
        description: "패키지 데이터 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleExcelUpload = async (file: File, revenueType: 'inpatient' | 'outpatient') => {
    if (!selectedPatientDetail) return;

    const setLoading = revenueType === 'inpatient' ? setUploadingInpatient : setUploadingOutpatient;
    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // 여러 range 시도하여 헤더 자동 탐지
      let jsonData: any[] = [];
      const rangesToTry = [5, 6, 7, 8, 9]; // 6번째~10번째 행 시도
      
      for (const rangeIndex of rangesToTry) {
        const testData = XLSX.utils.sheet_to_json(worksheet, { 
          range: rangeIndex,
          raw: false,
          defval: ''
        });
        
        console.log(`🔍 Range ${rangeIndex + 1}번째 행 시도:`, testData.length > 0 ? testData[0] : 'empty');
        
        // '수납일자'와 '입금총액' 컬럼이 있는지 확인
        if (testData.length > 0 && testData[0]['수납일자'] && testData[0]['입금총액'] !== undefined) {
          console.log(`✅ Range ${rangeIndex + 1}번째 행에서 헤더 발견!`);
          jsonData = testData;
          break;
        }
      }

      if (jsonData.length === 0) {
        console.error('❌ 유효한 헤더를 찾을 수 없습니다');
        toast({
          title: "오류",
          description: "엑셀 파일 형식을 인식할 수 없습니다.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('📊 엑셀 전체 데이터:', jsonData.length, '행');
      console.log('📋 첫 번째 데이터 행:', jsonData[0]);
      console.log('📋 마지막 데이터 행:', jsonData[jsonData.length - 1]);
      console.log('📋 컬럼명들:', Object.keys(jsonData[0]));

      // 수납일자와 입금총액 추출
      const transactions: { date: string; amount: number }[] = [];
      let skippedCount = 0;
      let invalidDateCount = 0;
      let invalidAmountCount = 0;

      jsonData.forEach((row: any, index: number) => {
        // 빈 행이거나 합계 행은 제외
        if (!row['수납일자'] || row['순서'] === '합계' || row['순서'] === '') {
          skippedCount++;
          return;
        }

        const dateStr = row['수납일자'];
        const amountStr = row['입금총액'];

        // 입금총액이 빈 문자열이거나 undefined인 경우 0으로 처리
        if (dateStr && (amountStr !== undefined || amountStr === '')) {
          // 날짜 파싱
          let date: Date;
          
          // YYYY-MM-DD 형식의 문자열
          if (typeof dateStr === 'string' && dateStr.includes('-')) {
            date = new Date(dateStr);
          } 
          // 엑셀 시리얼 날짜 (숫자)
          else if (typeof dateStr === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            date = new Date(excelEpoch.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000);
          }
          // 다른 날짜 형식 시도
          else {
            date = new Date(dateStr);
          }

          // 금액 파싱 (쉼표 제거, 빈 값은 0으로)
          let amount = 0;
          if (amountStr === '' || amountStr === undefined || amountStr === null) {
            amount = 0;
          } else if (typeof amountStr === 'number') {
            amount = amountStr;
          } else if (typeof amountStr === 'string') {
            const parsed = parseFloat(amountStr.replace(/,/g, ''));
            amount = isNaN(parsed) ? 0 : parsed;
          }

          if (!isNaN(date.getTime())) {
            transactions.push({
              date: date.toISOString().split('T')[0],
              amount: amount
            });
          } else {
            invalidDateCount++;
          }
        } else {
          if (!dateStr) invalidDateCount++;
        }
      });

      console.log(`📊 파싱 통계:`);
      console.log(`- 전체 행: ${jsonData.length}개`);
      console.log(`- 스킵된 행(빈 행/합계): ${skippedCount}개`);
      console.log(`- 유효하지 않은 날짜: ${invalidDateCount}개`);
      console.log(`- 추출된 거래: ${transactions.length}건`);
      console.log(`- 금액 합계: ${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}원`);
      console.log(`✅ ${revenueType === 'inpatient' ? '입원' : '외래'} 거래 데이터 추출 완료:`, transactions.length, '건');

      if (transactions.length === 0) {
        toast({
          title: "오류",
          description: "유효한 데이터를 찾을 수 없습니다. 수납일자와 입금총액 컬럼을 확인해주세요.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 기존 거래 내역 조회 (중복 체크용 - 예치금 입금과 현재 매출 타입만)
      const transactionType = revenueType === 'inpatient' ? 'inpatient_revenue' : 'outpatient_revenue';
      
      const { data: existingTransactions } = await supabase
        .from('package_transactions')
        .select('transaction_date, amount, transaction_type')
        .eq('patient_id', selectedPatientDetail.id)
        .in('transaction_type', ['deposit_in', transactionType]); // 예치금 입금과 현재 매출 타입만 조회

      console.log('📋 기존 거래 내역 (예치금 입금 + 현재 매출):', existingTransactions);

      // 중복 체크: 예치금 입금(deposit_in) 또는 같은 매출 타입과 날짜+금액이 같으면 제외
      const newTransactions = transactions.filter(t => {
        const isDuplicate = existingTransactions?.some(existing => 
          existing.transaction_date === t.date && 
          existing.amount === t.amount &&
          (existing.transaction_type === 'deposit_in' || existing.transaction_type === transactionType)
        );
        return !isDuplicate;
      });

      console.log(`🆕 신규 거래 (중복 제외):`, newTransactions);

      if (newTransactions.length === 0) {
        toast({
          title: "알림",
          description: "모든 데이터가 이미 등록되어 있습니다. 중복 데이터를 제외했습니다.",
        });
        setLoading(false);
        return;
      }

      // 신규 거래 삽입
      const transactionsToInsert = newTransactions.map(t => ({
        patient_id: selectedPatientDetail.id,
        customer_number: selectedPatientDetail.customer_number,
        transaction_date: t.date,
        transaction_type: transactionType,
        amount: t.amount,
        count: 0,
        note: `${revenueType === 'inpatient' ? '입원' : '외래'} 매출 (엑셀 업로드)`
      }));

      const { error: insertError } = await supabase
        .from('package_transactions')
        .insert(transactionsToInsert);

      if (insertError) throw insertError;

      console.log(`✅ ${transactionsToInsert.length}건의 새로운 거래 내역 추가 완료`);

      // 환자의 payment_amount 업데이트 (모든 거래 내역 합산)
      const { data: allTransactions } = await supabase
        .from('package_transactions')
        .select('amount, transaction_type')
        .eq('patient_id', selectedPatientDetail.id);

      const totalPayment = allTransactions?.reduce((sum, t) => {
        // deposit_in, inpatient_revenue, outpatient_revenue만 합산
        if (['deposit_in', 'inpatient_revenue', 'outpatient_revenue'].includes(t.transaction_type)) {
          return sum + t.amount;
        }
        return sum;
      }, 0) || 0;

      const { error: updateError } = await supabase
        .from('patients')
        .update({ payment_amount: totalPayment })
        .eq('id', selectedPatientDetail.id);

      if (updateError) throw updateError;

      console.log(`💰 총 수납금액 업데이트: ${totalPayment.toLocaleString()}원`);

      // 패키지 데이터와 환자 목록 동시 갱신
      setSelectedPatientDetail(null);
      
      await Promise.all([
        fetchPackageData(selectedPatientDetail.id),
        fetchPatients()
      ]);

      // 업데이트된 환자 정보 조회
      const { data: updatedPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', selectedPatientDetail.id)
        .single();

      // 모달 다시 열기
      if (updatedPatient) {
        setSelectedPatientDetail(updatedPatient);
      }

      toast({
        title: "✅ 매출 데이터 업로드 완료",
        description: `${transactionsToInsert.length}건의 새로운 ${revenueType === 'inpatient' ? '입원' : '외래'} 매출 데이터를 추가했습니다.`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error uploading excel:', error);
      toast({
        title: "오류",
        description: "엑셀 파일 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRevenueData = async (revenueType: 'inpatient' | 'outpatient') => {
    if (!selectedPatientDetail) return;

    const typeLabel = revenueType === 'inpatient' ? '입원' : '외래';
    
    if (!window.confirm(`${typeLabel} 매출 데이터를 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const transactionType = revenueType === 'inpatient' ? 'inpatient_revenue' : 'outpatient_revenue';
      
      // 해당 타입의 매출 데이터만 삭제
      const { error: deleteError } = await supabase
        .from('package_transactions')
        .delete()
        .eq('patient_id', selectedPatientDetail.id)
        .eq('transaction_type', transactionType);

      if (deleteError) throw deleteError;

      console.log(`✅ ${typeLabel} 매출 데이터 삭제 완료`);

      // 환자의 payment_amount 재계산 (deposit_in, inpatient_revenue, outpatient_revenue 합산)
      const { data: allTransactions } = await supabase
        .from('package_transactions')
        .select('amount, transaction_type')
        .eq('patient_id', selectedPatientDetail.id);

      const totalPayment = allTransactions?.reduce((sum, t) => {
        if (['deposit_in', 'inpatient_revenue', 'outpatient_revenue'].includes(t.transaction_type)) {
          return sum + t.amount;
        }
        return sum;
      }, 0) || 0;

      const { error: updateError } = await supabase
        .from('patients')
        .update({ payment_amount: totalPayment })
        .eq('id', selectedPatientDetail.id);

      if (updateError) throw updateError;

      console.log(`💰 총 수납금액 재계산: ${totalPayment.toLocaleString()}원`);

      // UI 갱신
      setSelectedPatientDetail(null);
      
      await Promise.all([
        fetchPackageData(selectedPatientDetail.id),
        fetchPatients()
      ]);

      const { data: updatedPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', selectedPatientDetail.id)
        .single();

      if (updatedPatient) {
        setSelectedPatientDetail(updatedPatient);
      }

      toast({
        title: "✅ 삭제 완료",
        description: `${typeLabel} 매출 데이터가 모두 삭제되었습니다.`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting revenue data:', error);
      toast({
        title: "오류",
        description: `${typeLabel} 매출 데이터 삭제 중 오류가 발생했습니다.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSingleTransaction = async (transactionId: string, revenueType: 'inpatient' | 'outpatient') => {
    if (!selectedPatientDetail) return;

    const typeLabel = revenueType === 'inpatient' ? '입원' : '외래';
    
    if (!window.confirm(`이 ${typeLabel} 매출 항목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 단일 거래 삭제
      const { error: deleteError } = await supabase
        .from('package_transactions')
        .delete()
        .eq('id', transactionId);

      if (deleteError) throw deleteError;

      console.log(`✅ ${typeLabel} 매출 항목 삭제 완료`);

      // 환자의 payment_amount 재계산
      const { data: allTransactions } = await supabase
        .from('package_transactions')
        .select('amount, transaction_type')
        .eq('patient_id', selectedPatientDetail.id);

      const totalPayment = allTransactions?.reduce((sum, t) => {
        if (['deposit_in', 'inpatient_revenue', 'outpatient_revenue'].includes(t.transaction_type)) {
          return sum + t.amount;
        }
        return sum;
      }, 0) || 0;

      const { error: updateError } = await supabase
        .from('patients')
        .update({ payment_amount: totalPayment })
        .eq('id', selectedPatientDetail.id);

      if (updateError) throw updateError;

      // UI 갱신
      setSelectedPatientDetail(null);
      
      await Promise.all([
        fetchPackageData(selectedPatientDetail.id),
        fetchPatients()
      ]);

      const { data: updatedPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', selectedPatientDetail.id)
        .single();

      if (updatedPatient) {
        setSelectedPatientDetail(updatedPatient);
      }

      toast({
        title: "✅ 삭제 완료",
        description: `${typeLabel} 매출 항목이 삭제되었습니다.`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting single transaction:', error);
      toast({
        title: "오류",
        description: `${typeLabel} 매출 항목 삭제 중 오류가 발생했습니다.`,
        variant: "destructive",
      });
    }
  };

  const handlePackageDataReceived = async (data: any) => {
    console.log('📦 패키지 데이터 수신:', data);
    
    if (!data || !data.customerNumber) {
      console.error('Invalid package data received:', data);
      setSyncingPackage(false);
      return;
    }

    try {
      // 고객번호로 환자 찾기
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('customer_number', data.customerNumber)
        .maybeSingle();

      if (patientError) throw patientError;
      
      if (!patient) {
        toast({
          title: "오류",
          description: "해당 고객번호의 환자를 찾을 수 없습니다.",
          variant: "destructive",
        });
        setSyncingPackage(false);
        return;
      }

      console.log('✅ 환자 찾음:', patient.id);

      // 기존 거래 내역 조회 (중복 체크용)
      const { data: existingTransactions, error: fetchError } = await supabase
        .from('package_transactions')
        .select('transaction_date, transaction_type, amount, count')
        .eq('patient_id', patient.id);

      if (fetchError) throw fetchError;

      // 중복 체크를 위한 Set 생성
      const existingKeys = new Set(
        (existingTransactions || []).map(t => 
          `${t.transaction_date}_${t.transaction_type}_${t.amount}_${t.count}`
        )
      );

      console.log('📋 기존 거래 내역:', existingTransactions?.length || 0, '건');

      // 일자별 거래 내역 저장
      const transactionsToInsert: any[] = [];

      // 예치금 입금
      data.depositIncome?.forEach((item: any) => {
        if (item.date && item.value) {
          const transaction = {
            patient_id: patient.id,
            customer_number: data.customerNumber,
            transaction_date: parseKoreanDate(item.date),
            transaction_type: 'deposit_in',
            amount: item.value,
            count: 0,
            note: item.note || null
          };
          const key = `${transaction.transaction_date}_${transaction.transaction_type}_${transaction.amount}_${transaction.count}`;
          if (!existingKeys.has(key)) {
            transactionsToInsert.push(transaction);
          }
        }
      });

      // 예치금 사용
      data.depositUsage?.forEach((item: any) => {
        if (item.date && item.value) {
          const transaction = {
            patient_id: patient.id,
            customer_number: data.customerNumber,
            transaction_date: parseKoreanDate(item.date),
            date_from: item.dateFrom ? parseKoreanDate(item.dateFrom) : parseKoreanDate(item.date),
            date_to: item.dateTo ? parseKoreanDate(item.dateTo) : parseKoreanDate(item.date),
            transaction_type: 'deposit_out',
            amount: item.value,
            count: 0,
            note: item.note || null
          };
          const key = `${transaction.transaction_date}_${transaction.transaction_type}_${transaction.amount}_${transaction.count}`;
          if (!existingKeys.has(key)) {
            transactionsToInsert.push(transaction);
          }
        }
      });

      // 적립금 입금
      data.rewardIncome?.forEach((item: any) => {
        if (item.date && item.value) {
          const transaction = {
            patient_id: patient.id,
            customer_number: data.customerNumber,
            transaction_date: parseKoreanDate(item.date),
            transaction_type: 'reward_in',
            amount: item.value,
            count: 0,
            note: item.note || null
          };
          const key = `${transaction.transaction_date}_${transaction.transaction_type}_${transaction.amount}_${transaction.count}`;
          if (!existingKeys.has(key)) {
            transactionsToInsert.push(transaction);
          }
        }
      });

      // 적립금 사용
      data.rewardUsage?.forEach((item: any) => {
        if (item.date && item.value) {
          const transaction = {
            patient_id: patient.id,
            customer_number: data.customerNumber,
            transaction_date: parseKoreanDate(item.date),
            date_from: item.dateFrom ? parseKoreanDate(item.dateFrom) : parseKoreanDate(item.date),
            date_to: item.dateTo ? parseKoreanDate(item.dateTo) : parseKoreanDate(item.date),
            transaction_type: 'reward_out',
            amount: item.value,
            count: 0,
            note: item.note || null
          };
          const key = `${transaction.transaction_date}_${transaction.transaction_type}_${transaction.amount}_${transaction.count}`;
          if (!existingKeys.has(key)) {
            transactionsToInsert.push(transaction);
          }
        }
      });

      // 횟수 입력
      data.countInput?.forEach((item: any) => {
        if (item.date && item.value) {
          const transaction = {
            patient_id: patient.id,
            customer_number: data.customerNumber,
            transaction_date: parseKoreanDate(item.date),
            transaction_type: 'count_in',
            amount: 0,
            count: item.value,
            note: item.note || null
          };
          const key = `${transaction.transaction_date}_${transaction.transaction_type}_${transaction.amount}_${transaction.count}`;
          if (!existingKeys.has(key)) {
            transactionsToInsert.push(transaction);
          }
        }
      });

      // 횟수 사용
      data.countUsage?.forEach((item: any) => {
        if (item.date && item.value) {
          const transaction = {
            patient_id: patient.id,
            customer_number: data.customerNumber,
            transaction_date: parseKoreanDate(item.date),
            date_from: item.dateFrom ? parseKoreanDate(item.dateFrom) : parseKoreanDate(item.date),
            date_to: item.dateTo ? parseKoreanDate(item.dateTo) : parseKoreanDate(item.date),
            transaction_type: 'count_out',
            amount: 0,
            count: item.value,
            note: item.note || null
          };
          const key = `${transaction.transaction_date}_${transaction.transaction_type}_${transaction.amount}_${transaction.count}`;
          if (!existingKeys.has(key)) {
            transactionsToInsert.push(transaction);
          }
        }
      });

      console.log('💾 저장할 거래 내역:', transactionsToInsert.length, '건 (중복 제외)');

      // 거래 내역 저장 (중복되지 않은 것만)
      if (transactionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('package_transactions')
          .insert(transactionsToInsert);

        if (insertError) throw insertError;
      }

      // 전체 거래 내역 다시 조회해서 합계 계산 (기존 + 새로운)
      const { data: allTransactions, error: allError } = await supabase
        .from('package_transactions')
        .select('transaction_type, amount, count')
        .eq('patient_id', patient.id);

      if (allError) throw allError;

      // 합계 계산
      const depositTotal = (allTransactions || [])
        .filter(t => t.transaction_type === 'deposit_in')
        .reduce((sum, t) => sum + t.amount, 0);
      const depositUsed = (allTransactions || [])
        .filter(t => t.transaction_type === 'deposit_out')
        .reduce((sum, t) => sum + t.amount, 0);
      const rewardTotal = (allTransactions || [])
        .filter(t => t.transaction_type === 'reward_in')
        .reduce((sum, t) => sum + t.amount, 0);
      const rewardUsed = (allTransactions || [])
        .filter(t => t.transaction_type === 'reward_out')
        .reduce((sum, t) => sum + t.amount, 0);
      const countTotal = (allTransactions || [])
        .filter(t => t.transaction_type === 'count_in')
        .reduce((sum, t) => sum + t.count, 0);
      const countUsed = (allTransactions || [])
        .filter(t => t.transaction_type === 'count_out')
        .reduce((sum, t) => sum + t.count, 0);

      // 패키지 관리 요약 데이터 UPSERT
      const packagePayload = {
        patient_id: patient.id,
        customer_number: data.customerNumber,
        deposit_total: depositTotal,
        deposit_used: depositUsed,
        deposit_balance: depositTotal - depositUsed,
        reward_total: rewardTotal,
        reward_used: rewardUsed,
        reward_balance: rewardTotal - rewardUsed,
        count_total: countTotal,
        count_used: countUsed,
        count_balance: countTotal - countUsed,
        last_synced_at: data.lastSyncedAt || new Date().toISOString(),
      };

      console.log('💾 저장할 패키지 요약 데이터:', packagePayload);

      const { error: upsertError } = await supabase
        .from('package_management')
        .upsert(packagePayload, { onConflict: 'patient_id' });

      if (upsertError) throw upsertError;

      // 예치금 입금 총액을 환자의 수납금액(payment_amount)에 업데이트
      const { error: paymentUpdateError } = await supabase
        .from('patients')
        .update({ payment_amount: depositTotal })
        .eq('id', patient.id);

      if (paymentUpdateError) throw paymentUpdateError;

      console.log('💰 환자 수납금액 업데이트:', depositTotal);

      // 항상 패키지 데이터 갱신
      if (selectedPatientDetail?.id === patient.id) {
        console.log('🔄 현재 선택된 환자의 패키지 데이터 갱신 중...');
        
        // 모달을 닫고 데이터 갱신
        setSelectedPatientDetail(null);
        
        // 패키지 데이터와 환자 목록 동시 갱신
        await Promise.all([
          fetchPackageData(patient.id),
          fetchPatients()
        ]);
        
        // 업데이트된 환자 정보 조회
        const { data: updatedPatient } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patient.id)
          .single();
        
        // 모달 다시 열기
        if (updatedPatient) {
          setSelectedPatientDetail(updatedPatient);
        }
        
        toast({
          title: "✅ 패키지 정보 업데이트 완료",
          description: `${transactionsToInsert.length}건의 새로운 거래 내역을 추가했습니다. (중복 제외)`,
          duration: 2000,
        });
      } else {
        // 환자 목록 새로고침 (다른 환자여도 목록 업데이트)
        await fetchPatients();
        
        toast({
          title: "패키지 정보 저장 완료",
          description: `${transactionsToInsert.length}건의 새로운 거래 내역을 저장했습니다. 해당 환자를 다시 선택하면 확인할 수 있습니다.`,
          duration: 2000,
        });
      }
      
      // 동기화 완료
      setSyncingPackage(false);
    } catch (error) {
      console.error('Error saving package data:', error);
      toast({
        title: "오류",
        description: "패키지 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setSyncingPackage(false);
    }
  };

  // 한국어 날짜 형식을 YYYY-MM-DD로 변환
  const parseKoreanDate = (dateStr: string): string => {
    try {
      // 이미 올바른 형식이면 그대로 반환
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      
      // YYYYMMDD 형식 (예: 20240213)
      const cleaned = dateStr.replace(/[^0-9]/g, '');
      if (cleaned.length === 8) {
        return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6, 8)}`;
      }
      
      // YYMMDD 형식 (예: 240213)
      if (cleaned.length === 6) {
        const yy = cleaned.substring(0, 2);
        const year = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`;
        return `${year}-${cleaned.substring(2, 4)}-${cleaned.substring(4, 6)}`;
      }
      
      // 기본값: 오늘 날짜
      console.warn('날짜 형식을 인식할 수 없음:', dateStr);
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error('날짜 파싱 오류:', dateStr, error);
      return new Date().toISOString().split('T')[0];
    }
  };

  const updateEditingField = (field: string, value: any) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
    setSelectedPatientDetail(prev => prev ? { ...prev, [field]: value } : null);
  };

  const savePatientField = async (field: string, value: any) => {
    if (!selectedPatientDetail) return;

    // 관리자 권한 체크
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
        .update({ [field]: value })
        .eq('id', selectedPatientDetail.id);

      if (error) throw error;

      // Update patients list with management_status to trigger background color update
      setPatients(prev => prev.map(p => 
        p.id === selectedPatientDetail.id ? { ...p, [field]: value, management_status: field === 'management_status' ? value : p.management_status } : p
      ));

      // Remove from editing fields
      setEditingFields(prev => {
        const newFields = { ...prev };
        delete newFields[field];
        return newFields;
      });

      toast({
        title: "성공",
        description: "정보가 저장되었습니다.",
      });
    } catch (error) {
      console.error('Error updating patient field:', error);
      toast({
        title: "오류",
        description: "정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const saveAllEditingFields = async () => {
    if (!selectedPatientDetail || Object.keys(editingFields).length === 0) return;

    // 관리자 권한 체크
    if (userRole === 'admin') {
      toast({
        title: "권한 없음",
        description: "관리자는 환자 정보를 수정할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 모든 편집된 필드를 한 번에 업데이트
      const { error } = await supabase
        .from('patients')
        .update(editingFields)
        .eq('id', selectedPatientDetail.id);

      if (error) throw error;

      // Update patients list including management_status
      setPatients(prev => prev.map(p => 
        p.id === selectedPatientDetail.id ? { ...p, ...editingFields } : p
      ));

      // Update selected patient detail
      setSelectedPatientDetail(prev => prev ? { ...prev, ...editingFields } : null);

      // Clear editing fields
      setEditingFields({});

      toast({
        title: "성공",
        description: "정보가 저장되었습니다.",
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

  // 관리 상태가 일별 관리에서 제외되는지 확인하는 함수
  const isExcludedFromTracking = (managementStatus?: string) => {
    if (!managementStatus) return false;
    const statusOption = patientStatusOptions.find(opt => opt.name === managementStatus);
    return statusOption?.exclude_from_daily_tracking || false;
  };

  // 관리 상태에 따른 배경색 반환
  const getManagementStatusBgColor = (managementStatus?: string) => {
    if (!managementStatus) return '';
    
    switch (managementStatus) {
      case '아웃위기':
        return 'bg-orange-100 dark:bg-orange-950/30';
      case '아웃':
        return 'bg-red-100 dark:bg-red-950/30';
      default:
        // 다른 exclude_from_daily_tracking 상태들 (사망, 치료종료 등)
        const statusOption = patientStatusOptions.find(opt => opt.name === managementStatus);
        if (statusOption?.exclude_from_daily_tracking) {
          return 'bg-pink-100 dark:bg-pink-950/30';
        }
        return '';
    }
  };

  const getInflowStatusColor = (status?: string) => {
    switch (status) {
      case '유입':
        return 'default';
      case '상담':
        return 'secondary';
      case '입원':
        return 'destructive';
      case '퇴원':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const renderTreatmentManagement = () => {
    // 거래 타입별로 그룹화
    const depositIncome = packageTransactions.filter(t => t.transaction_type === 'deposit_in');
    const depositOut = packageTransactions.filter(t => t.transaction_type === 'deposit_out');
    const rewardIncome = packageTransactions.filter(t => t.transaction_type === 'reward_in');
    const rewardOut = packageTransactions.filter(t => t.transaction_type === 'reward_out');
    const countIn = packageTransactions.filter(t => t.transaction_type === 'count_in');
    const countOut = packageTransactions.filter(t => t.transaction_type === 'count_out');

    const TransactionGrid = ({ 
      title, 
      transactions, 
      type, 
      isUsage 
    }: { 
      title: string; 
      transactions: PackageTransaction[]; 
      type: 'amount' | 'count';
      isUsage?: boolean;
    }) => {
      // 날짜를 YYYY-MM-DD 형식으로 포맷
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

      // 헤더 텍스트 결정
      const getHeaders = () => {
        if (title.includes('예치금 입금')) return { date: '입금일자', value: '예치금 입금', showRange: false };
        if (title.includes('예치금 사용')) return { dateFrom: '사용일자F', dateTo: '사용일자T', value: '예치금 사용', showRange: true };
        if (title.includes('적립금 입금')) return { date: '입금일자', value: '적립금 입금', showRange: false };
        if (title.includes('적립금 사용')) return { dateFrom: '사용일자F', dateTo: '사용일자T', value: '적립금 사용', showRange: true };
        if (title.includes('횟수 입력')) return { date: '입력일자', value: '횟수 입력', showRange: false };
        if (title.includes('횟수 사용')) return { date: '사용일자', value: '횟수 사용', showRange: false };
        return { date: '일자', value: type === 'amount' ? '금액' : '횟수', showRange: false };
      };

      const headers = getHeaders();
      const total = transactions.reduce((sum, t) => sum + (type === 'amount' ? t.amount : t.count), 0);
      const totalCount = transactions.reduce((sum, t) => sum + t.count, 0);
      const remainingCount = title.includes('횟수') 
        ? countIn.reduce((sum, t) => sum + t.count, 0) - countOut.reduce((sum, t) => sum + t.count, 0)
        : 0;

      // 잔액 계산
      const getBalance = () => {
        if (title.includes('예치금 입금')) {
          const depositTotal = depositIncome.reduce((sum, t) => sum + t.amount, 0);
          const depositUsed = depositOut.reduce((sum, t) => sum + t.amount, 0);
          return depositTotal - depositUsed;
        }
        if (title.includes('적립금 입금')) {
          const rewardTotal = rewardIncome.reduce((sum, t) => sum + t.amount, 0);
          const rewardUsed = rewardOut.reduce((sum, t) => sum + t.amount, 0);
          return rewardTotal - rewardUsed;
        }
        return null;
      };

      const balance = getBalance();

      return (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-muted px-4 py-2 font-semibold text-sm border-b">{title}</div>
          <div className="max-h-64 overflow-y-auto">
            <Table className="border-collapse">
              <TableHeader className="sticky top-0 bg-muted/50">
                <TableRow>
                  {headers.showRange ? (
                    <>
                      <TableHead className="w-28 border border-border text-center font-semibold">{headers.dateFrom}</TableHead>
                      <TableHead className="w-28 border border-border text-center font-semibold">{headers.dateTo}</TableHead>
                    </>
                  ) : (
                    <TableHead className="w-32 border border-border text-center font-semibold">{headers.date}</TableHead>
                  )}
                  <TableHead className="border border-border text-center font-semibold">{headers.value}</TableHead>
                  <TableHead className="border border-border text-center font-semibold">비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.showRange ? 4 : 3} className="border border-border text-center text-muted-foreground py-4">
                      데이터 없음
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/30">
                      {headers.showRange ? (
                        <>
                          <TableCell className="border border-border font-mono text-sm text-center">
                            {formatDate((transaction as any).date_from)}
                          </TableCell>
                          <TableCell className="border border-border font-mono text-sm text-center">
                            {formatDate((transaction as any).date_to)}
                          </TableCell>
                        </>
                      ) : (
                        <TableCell className="border border-border font-mono text-sm text-center">
                          {formatDate(transaction.transaction_date)}
                        </TableCell>
                      )}
                      <TableCell className="border border-border text-right font-semibold">
                        {type === 'amount' 
                          ? `${transaction.amount.toLocaleString()}원`
                          : `${transaction.count}회`
                        }
                      </TableCell>
                      <TableCell className="border border-border text-sm text-muted-foreground">
                        {transaction.note || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="bg-muted/50 px-4 py-2 flex justify-between items-center border-t">
            <span className="font-semibold text-sm">
              합계{title.includes('횟수 입력') ? ` / 남은 횟수: ${remainingCount}` : ''}
              {balance !== null && ` / 잔액:`}
            </span>
            <div className="flex items-center gap-4">
              <span className="font-bold text-primary">
                {type === 'amount'
                  ? `${total.toLocaleString()}원`
                  : `${totalCount}회`
                }
              </span>
              {balance !== null && (
                <span className="font-bold text-green-600">
                  {balance.toLocaleString()}원
                </span>
              )}
            </div>
          </div>
        </div>
      );
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
        ) : !packageData && packageTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            최신화 버튼을 클릭하여 CRM에서 패키지 정보를 가져오세요.
          </div>
        ) : (
          <>
            {/* 합계 카드 */}
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

            {/* 거래 내역 그리드 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground">일자별 거래 내역</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TransactionGrid title="예치금 입금" transactions={depositIncome} type="amount" isUsage={false} />
                <TransactionGrid title="예치금 사용" transactions={depositOut} type="amount" isUsage={true} />
                <TransactionGrid title="적립금 입금" transactions={rewardIncome} type="amount" isUsage={false} />
                <TransactionGrid title="적립금 사용" transactions={rewardOut} type="amount" isUsage={true} />
                <TransactionGrid title="횟수 입력" transactions={countIn} type="count" isUsage={false} />
                <TransactionGrid title="횟수 사용" transactions={countOut} type="count" isUsage={true} />
              </div>
            </div>
          </>
        )}

        {packageData?.last_synced_at && (
          <div className="text-xs text-muted-foreground text-right">
            마지막 동기화: {new Date(packageData.last_synced_at).toLocaleString('ko-KR')}
          </div>
        )}

        {/* 입원 매출 관리 */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">입원 매출 관리</h3>
            </div>
            <div className="flex gap-2">
              <label htmlFor="inpatient-excel-upload">
                <input
                  id="inpatient-excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleExcelUpload(file, 'inpatient');
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={uploadingInpatient}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('inpatient-excel-upload')?.click();
                  }}
                >
                  <Upload className={`h-4 w-4 ${uploadingInpatient ? 'animate-pulse' : ''}`} />
                  {uploadingInpatient ? '업로드 중...' : '엑셀 업로드'}
                </Button>
              </label>
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
          </div>
          
          {packageTransactions.filter(t => t.transaction_type === 'inpatient_revenue').length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                총 {packageTransactions.filter(t => t.transaction_type === 'inpatient_revenue').length}건 | 
                합계: {packageTransactions
                  .filter(t => t.transaction_type === 'inpatient_revenue')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}원
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>수납일자</TableHead>
                      <TableHead className="text-right">입금총액</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packageTransactions
                      .filter(t => t.transaction_type === 'inpatient_revenue')
                      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                      .map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{new Date(t.transaction_date).toLocaleDateString('ko-KR')}</TableCell>
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
              {(() => {
                const inpatientTransactions = packageTransactions.filter(t => t.transaction_type === 'inpatient_revenue');
                if (inpatientTransactions.length > 0) {
                  const latestUpload = inpatientTransactions.reduce((latest, current) => 
                    new Date(current.created_at) > new Date(latest.created_at) ? current : latest
                  );
                  return (
                    <div className="text-xs text-muted-foreground text-right pt-2">
                      마지막 업로드: {new Date(latestUpload.created_at).toLocaleString('ko-KR')}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm border rounded-md bg-muted/30">
              입원 매출 데이터가 없습니다. 엑셀 파일을 업로드하세요.
            </div>
          )}
        </div>

        {/* 외래 매출 관리 */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">외래 매출 관리</h3>
            </div>
            <div className="flex gap-2">
              <label htmlFor="outpatient-excel-upload">
                <input
                  id="outpatient-excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleExcelUpload(file, 'outpatient');
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={uploadingOutpatient}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('outpatient-excel-upload')?.click();
                  }}
                >
                  <Upload className={`h-4 w-4 ${uploadingOutpatient ? 'animate-pulse' : ''}`} />
                  {uploadingOutpatient ? '업로드 중...' : '엑셀 업로드'}
                </Button>
              </label>
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
          </div>
          
          {packageTransactions.filter(t => t.transaction_type === 'outpatient_revenue').length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                총 {packageTransactions.filter(t => t.transaction_type === 'outpatient_revenue').length}건 | 
                합계: {packageTransactions
                  .filter(t => t.transaction_type === 'outpatient_revenue')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}원
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>수납일자</TableHead>
                      <TableHead className="text-right">입금총액</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packageTransactions
                      .filter(t => t.transaction_type === 'outpatient_revenue')
                      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                      .map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{new Date(t.transaction_date).toLocaleDateString('ko-KR')}</TableCell>
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
              {(() => {
                const outpatientTransactions = packageTransactions.filter(t => t.transaction_type === 'outpatient_revenue');
                if (outpatientTransactions.length > 0) {
                  const latestUpload = outpatientTransactions.reduce((latest, current) => 
                    new Date(current.created_at) > new Date(latest.created_at) ? current : latest
                  );
                  return (
                    <div className="text-xs text-muted-foreground text-right pt-2">
                      마지막 업로드: {new Date(latestUpload.created_at).toLocaleString('ko-KR')}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm border rounded-md bg-muted/30">
              외래 매출 데이터가 없습니다. 엑셀 파일을 업로드하세요.
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  return (
    <div className="max-w-none mx-auto p-6 w-full">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">관리 환자 리스트</h1>
      </div>

      <Card className="w-full overflow-x-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>유입 환자 목록 ({filteredPatients.length}명)</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="환자명, 차트번호, 담당자, 주치의, 입원/외래, 이전병원으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>고객번호</TableHead>
                  <TableHead>외래/입원구분</TableHead>
                  <TableHead>담당실장</TableHead>
                  <TableHead>환자명</TableHead>
                  <TableHead>진단명</TableHead>
                  <TableHead>유입일</TableHead>
                  <TableHead>실비보험유형</TableHead>
                  <TableHead>본병원치료</TableHead>
                  <TableHead>본병원검사일정</TableHead>
                  <TableHead>우리병원치료계획</TableHead>
                  <TableHead>월평균입원일수</TableHead>
                  <TableHead>월평균외래일수</TableHead>
                  <TableHead>마지막내원일</TableHead>
                  <TableHead>수납급액(비급여)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const bgColor = getManagementStatusBgColor((patient as any).management_status);
                  const isOut = isExcludedFromTracking((patient as any).management_status);
                  return (
                    <TableRow 
                      key={patient.id}
                      className={`cursor-pointer hover:bg-muted/50 ${bgColor} ${isOut ? 'italic' : ''}`}
                      onClick={() => {
                        setSelectedPatientDetail(patient);
                        setViewMode('full');
                        fetchPackageData(patient.id);
                      }}
                    >
                    <TableCell className="font-mono">{patient.customer_number || '-'}</TableCell>
                    <TableCell>{patient.visit_type || '-'}</TableCell>
                    <TableCell>{patient.manager_name || '-'}</TableCell>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.diagnosis_category || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(patient.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>{patient.insurance_type || '-'}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.hospital_treatment || '-'}
                    </TableCell>
                    <TableCell className="max-w-32 truncate">
                      {patient.examination_schedule || '-'}
                    </TableCell>
                    <TableCell className="max-w-32">
                      <div className="flex items-center gap-2">
                        <span className="truncate flex-1">
                          {patient.treatment_plan || '-'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatientDetail(patient);
                            setViewMode('treatment-only');
                            fetchPackageData(patient.id);
                          }}
                          className="px-2 py-1 h-6 text-xs"
                        >
                          상세보기
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {patient.monthly_avg_inpatient_days ? `${patient.monthly_avg_inpatient_days}일` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {patient.monthly_avg_outpatient_days ? `${patient.monthly_avg_outpatient_days}일` : '-'}
                    </TableCell>
                    <TableCell>
                      {patient.last_visit_date ? 
                        new Date(patient.last_visit_date).toLocaleDateString('ko-KR') : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {patient.payment_amount ? 
                        `${patient.payment_amount.toLocaleString()}원` : '-'
                      }
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? '검색 결과가 없습니다.' : '유입된 환자가 없습니다.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 환자 상세정보 모달 다이얼로그 */}
      <Dialog open={!!selectedPatientDetail} onOpenChange={() => {
        setSelectedPatientDetail(null);
        setViewMode('full');
        setPackageData(null);
        setEditingFields({});
      }}>
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
                  {/* 고객명 */}
                  <div>
                    <Label>고객명 *</Label>
                    <Input
                      value={selectedPatientDetail?.name || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 고객번호 */}
                  <div>
                    <Label>고객번호</Label>
                    <Input
                      value={selectedPatientDetail?.customer_number || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 주민번호 */}
                  <div>
                    <Label>주민번호</Label>
                    <Input
                      value={selectedPatientDetail?.resident_number_masked || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 휴대폰번호 */}
                  <div>
                    <Label>휴대폰번호</Label>
                    <Input
                      value={selectedPatientDetail?.phone || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 성별 */}
                  <div>
                    <Label>성별</Label>
                    <Input
                      value={selectedPatientDetail?.gender || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 나이(만) */}
                  <div>
                    <Label>나이(만)</Label>
                    <Input
                      value={selectedPatientDetail?.age?.toString() || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 내원동기 */}
                  <div>
                    <Label>내원동기</Label>
                    <Input
                      value={selectedPatientDetail?.visit_motivation || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 진단명 대분류 */}
                  <div>
                    <Label>진단명 (대분류)</Label>
                    <Input
                      value={selectedPatientDetail?.diagnosis_category || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 진단명 중분류 */}
                  <div>
                    <Label>진단명 (중분류)</Label>
                    <Input
                      value={selectedPatientDetail?.diagnosis_detail || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 이전병원 대분류 */}
                  <div>
                    <Label>이전병원 (대분류)</Label>
                    <Input
                      value={selectedPatientDetail?.hospital_category || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 이전병원 중분류 */}
                  <div>
                    <Label>이전병원 (중분류)</Label>
                    <Input
                      value={selectedPatientDetail?.hospital_branch || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* 주소 */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label>주소</Label>
                    <Input
                      value={selectedPatientDetail?.address || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* CRM메모 */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label>CRM메모</Label>
                    <Textarea
                      value={selectedPatientDetail?.crm_memo || ''}
                      disabled
                      className="bg-muted"
                      rows={3}
                    />
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
                  {/* 환자 or 보호자 */}
                  <div>
                    <Label>환자 or 보호자</Label>
                    <Select
                      value={selectedPatientDetail?.patient_or_guardian || '환자'}
                      onValueChange={(value) => {
                        updateEditingField('patient_or_guardian', value);
                      }}
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

                  {/* 식이 */}
                  <div>
                    <Label>식이</Label>
                    <Input
                      value={selectedPatientDetail?.diet_info || ''}
                      onChange={(e) => updateEditingField('diet_info', e.target.value)}
                      placeholder="식이정보"
                    />
                  </div>

                  {/* 유입상태 */}
                  <div>
                    <Label>유입상태 *</Label>
                    <Select
                      value={selectedPatientDetail?.inflow_status || '유입'}
                      onValueChange={(value) => {
                        updateEditingField('inflow_status', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        <SelectItem value="유입">유입</SelectItem>
                        <SelectItem value="실패">실패</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 내원형태 */}
                  <div>
                    <Label>내원형태</Label>
                    <Select
                      value={selectedPatientDetail?.visit_type || ''}
                      onValueChange={(value) => {
                        updateEditingField('visit_type', value);
                      }}
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

                  {/* 보호자 이름 */}
                  <div>
                    <Label>보호자 이름</Label>
                    <Input
                      value={selectedPatientDetail?.guardian_name || ''}
                      onChange={(e) => updateEditingField('guardian_name', e.target.value)}
                      placeholder="보호자 이름"
                    />
                  </div>

                  {/* 보호자 관계 */}
                  <div>
                    <Label>보호자 관계</Label>
                    <Input
                      value={selectedPatientDetail?.guardian_relationship || ''}
                      onChange={(e) => updateEditingField('guardian_relationship', e.target.value)}
                      placeholder="보호자 관계"
                    />
                  </div>

                  {/* 보호자 연락처 */}
                  <div>
                    <Label>보호자 연락처</Label>
                    <Input
                      value={selectedPatientDetail?.guardian_phone || ''}
                      onChange={(e) => updateEditingField('guardian_phone', e.target.value)}
                      placeholder="보호자 연락처"
                    />
                  </div>

                  {/* 담당자(상담실장) */}
                  <div>
                    <Label>담당자(상담실장)</Label>
                    <Input
                      value={selectedPatientDetail?.manager_name || currentUserName}
                      disabled
                      className="bg-muted"
                      placeholder="자동입력"
                    />
                  </div>

                  {/* 한방주치의 */}
                  <div>
                    <Label>한방주치의</Label>
                    <Input
                      value={selectedPatientDetail?.korean_doctor || ''}
                      onChange={(e) => updateEditingField('korean_doctor', e.target.value)}
                      placeholder="한방주치의"
                    />
                  </div>

                  {/* 양방주치의 */}
                  <div>
                    <Label>양방주치의</Label>
                    <Input
                      value={selectedPatientDetail?.western_doctor || ''}
                      onChange={(e) => updateEditingField('western_doctor', e.target.value)}
                      placeholder="양방주치의"
                    />
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
                    <Label htmlFor="insurance-type">실비보험유형</Label>
                    <Select 
                      value={selectedPatientDetail?.insurance_type || ''} 
                      onValueChange={(value) => {
                        updateEditingField('insurance_type', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="실비보험유형을 선택하세요" />
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
                    <Label>관리 상태</Label>
                    <Select 
                      value={selectedPatientDetail?.management_status || '관리 중'} 
                      onValueChange={(value) => {
                        updateEditingField('management_status', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="관리 상태를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        {patientStatusOptions.map(option => (
                          <SelectItem key={option.id} value={option.name}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      일별 환자 관리 현황에서 자동 계산
                    </p>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      일별 환자 관리 현황에서 자동 계산
                    </p>
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
                     <p className="text-xs text-muted-foreground mt-1">
                       패키지 관리에서 자동 계산
                     </p>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="hospital-treatment">본병원 치료</Label>
                    <Textarea
                      id="hospital-treatment"
                      placeholder="본병원 치료 내용을 입력하세요"
                      value={selectedPatientDetail?.hospital_treatment || ''}
                      onChange={(e) => updateEditingField('hospital_treatment', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="examination-schedule">본병원 검사일정</Label>
                    <Textarea
                      id="examination-schedule"
                      placeholder="본병원 검사일정을 입력하세요"
                      value={selectedPatientDetail?.examination_schedule || ''}
                      onChange={(e) => updateEditingField('examination_schedule', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* 담당자 메모 */}
                  <div className="md:col-span-2">
                    <Label htmlFor="manager-memo">담당자 메모</Label>
                    <Textarea
                      id="manager-memo"
                      placeholder="담당자 메모를 입력하세요"
                      value={selectedPatientDetail?.memo1 || ''}
                      onChange={(e) => updateEditingField('memo1', e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      일별 환자 관리 현황의 메모칸과 연동됩니다
                    </p>
                  </div>

                  {/* 일정 정보 */}
                  <div>
                    <Label>유입일</Label>
                    <div className="p-2 bg-muted rounded-md h-10 flex items-center">
                      <span className="text-sm">
                        {selectedPatientDetail?.created_at ? 
                          new Date(selectedPatientDetail.created_at).toLocaleDateString('ko-KR') : '-'}
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
    </div>
  );
}