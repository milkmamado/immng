import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, RefreshCw, ChevronUp, ChevronDown, CalendarDays, CalendarIcon, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AdmissionCycle {
  id: string;
  admission_date: string;
  discharge_date: string | null;
  admission_type: string;
  status: string;
}

interface Patient {
  id: string;
  name: string;
  customer_number?: string;
  diagnosis?: string;
  detailed_diagnosis?: string;
  korean_doctor?: string;
  western_doctor?: string;
  manager_name?: string;
  previous_hospital?: string;
  memo1?: string;
  memo2?: string;
  management_status?: string;
  admission_cycles?: AdmissionCycle[];
  resident_number_masked?: string;
  phone?: string;
  gender?: string;
  age?: number;
  visit_motivation?: string;
  address?: string;
  inflow_date?: string;
  consultation_date?: string;
  crm_memo?: string;
  special_note_1?: string;
  special_note_2?: string;
  treatment_memo_1?: string;
  treatment_memo_2?: string;
  last_visit_date?: string;
  
  diagnosis_detail?: string;
  hospital_category?: string;
  hospital_branch?: string;
  diet_info?: string;
  patient_or_guardian?: string;
  inflow_status?: string;
  visit_type?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  insurance_type?: string;
  hospital_treatment?: string;
  examination_schedule?: string;
  payment_amount?: number;
  created_at?: string;
}

interface DailyStatus {
  id: string;
  patient_id: string;
  status_date: string;
  status_type: string;
  notes?: string;
}

interface DailyStatusGridProps {
  patients: Patient[];
  dailyStatuses: DailyStatus[];
  yearMonth: string;
  daysInMonth: number;
  onStatusUpdate: (patientId: string, date: string, statusType: string, notes?: string) => Promise<void>;
  onMemoUpdate: (patientId: string, memoType: 'memo1' | 'memo2', value: string) => Promise<void>;
  onManagementStatusUpdate: (patientId: string, status: string) => Promise<void>;
  onOrderUpdate: (newOrder: string[]) => Promise<void>;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function DailyStatusGrid({
  patients,
  dailyStatuses,
  yearMonth,
  daysInMonth,
  onStatusUpdate,
  onMemoUpdate,
  onManagementStatusUpdate,
  onOrderUpdate,
  onPreviousMonth,
  onNextMonth,
}: DailyStatusGridProps) {
  const [selectedCell, setSelectedCell] = useState<{
    patientId: string;
    date: string;
    patient: Patient;
  } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [memoCell, setMemoCell] = useState<{
    patientId: string;
    memoType: 'memo1' | 'memo2';
    currentValue: string;
  } | null>(null);
  const [memoValue, setMemoValue] = useState<string>('');
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<any | null>(null);
  const [editingManagementStatus, setEditingManagementStatus] = useState<string>('');
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);
  
  // 일괄 스케줄 등록 관련 state
  const [bulkScheduleDialog, setBulkScheduleDialog] = useState<{
    open: boolean;
    patient: Patient | null;
  }>({ open: false, patient: null });
  const [selectedDates, setSelectedDates] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkNotes, setBulkNotes] = useState<string>('');
  
  const [patientStats, setPatientStats] = useState<{
    currentMonth: {
      admissionDays: number;
      dayCare: number;
      outpatient: number;
      phoneFollowUp: number;
      revenue: number;
    };
    total: {
      admissionDays: number;
      dayCare: number;
      outpatient: number;
      phoneFollowUp: number;
      revenue: number;
    };
  } | null>(null);
  const [editingFields, setEditingFields] = useState<Record<string, any>>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [diagnosisOptions, setDiagnosisOptions] = useState<any[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<any[]>([]);
  const [insuranceTypeOptions, setInsuranceTypeOptions] = useState<any[]>([]);
  const [patientStatusOptions, setPatientStatusOptions] = useState<any[]>([]);
  const [packageData, setPackageData] = useState<any | null>(null);
  const [packageTransactions, setPackageTransactions] = useState<any[]>([]);
  const [syncingPackage, setSyncingPackage] = useState(false);
  
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const statusTypes = ['입원', '퇴원', '재원', '낮병동', '외래', '기타', '전화F/U'];
  
  // 날짜별 필터 상태: { 날짜(1-31): [선택된 상태 타입들] }
  const [dateFilters, setDateFilters] = useState<Record<number, string[]>>({});
  
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...patients];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onOrderUpdate(newOrder.map(p => p.id));
  };

  const handleMoveDown = (index: number) => {
    if (index === patients.length - 1) return;
    const newOrder = [...patients];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onOrderUpdate(newOrder.map(p => p.id));
  };

  // 일괄 스케줄 등록 다이얼로그 열기
  const handleOpenBulkSchedule = (patient: Patient) => {
    setBulkScheduleDialog({ open: true, patient });
    setSelectedDates(new Set());
    setBulkStatus('');
    setBulkNotes('');
  };

  // 일괄 스케줄 등록 다이얼로그 닫기
  const handleCloseBulkSchedule = () => {
    setBulkScheduleDialog({ open: false, patient: null });
    setSelectedDates(new Set());
    setBulkStatus('');
    setBulkNotes('');
  };

  // 날짜 체크박스 토글
  const handleToggleDate = (day: number) => {
    const newDates = new Set(selectedDates);
    if (newDates.has(day)) {
      newDates.delete(day);
    } else {
      newDates.add(day);
    }
    setSelectedDates(newDates);
  };

  // 일괄 스케줄 등록 실행
  const handleBulkScheduleSubmit = async () => {
    if (!bulkScheduleDialog.patient || selectedDates.size === 0 || !bulkStatus) {
      return;
    }

    try {
      const [year, month] = yearMonth.split('-');
      const dateArray = Array.from(selectedDates).map(day => {
        const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
        return { date: dateStr, patientId: bulkScheduleDialog.patient!.id };
      });

      // 각 날짜에 대해 상태 업데이트
      for (const { date, patientId } of dateArray) {
        await onStatusUpdate(patientId, date, bulkStatus, bulkNotes || undefined);
      }

      handleCloseBulkSchedule();
    } catch (error) {
      console.error('Bulk schedule error:', error);
    }
  };


  // 옵션 데이터 및 사용자 정보 가져오기
  useEffect(() => {
    fetchOptions();
    fetchCurrentUserName();
    
    // Realtime 구독 설정 - patients 테이블 변경 감지
    const channel = supabase
      .channel('daily-status-modal-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'patients'
        },
        async (payload) => {
          console.log('DailyStatusGrid - Patient data changed:', payload);
          
          // 모달이 열려있고 업데이트된 환자가 현재 선택된 환자인 경우
          if (selectedPatientDetail && payload.new.id === selectedPatientDetail.id) {
            console.log('Re-fetching updated patient data for modal...');
            // DB에서 최신 데이터를 다시 가져옴 (admission_cycles 포함)
            const { data: updatedPatient } = await supabase
              .from('patients')
              .select(`
                *,
                admission_cycles (
                  id,
                  admission_date,
                  discharge_date,
                  admission_type,
                  status
                )
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (updatedPatient) {
              console.log('Updated patient data:', updatedPatient);
              setSelectedPatientDetail(updatedPatient as any);
            }
          }
        }
      )
      .subscribe();
    
    // CRM에서 postMessage로 패키지 데이터 수신
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'crm-package-data') {
        handlePackageDataReceived(event.data.data);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      supabase.removeChannel(channel);
    };
  }, [selectedPatientDetail]); // selectedPatientDetail 의존성 추가

  const fetchOptions = async () => {
    try {
      const [diagnosis, hospital, insurance, patientStatus] = await Promise.all([
        supabase.from('diagnosis_options').select('*').order('name'),
        supabase.from('hospital_options').select('*').order('name'),
        supabase.from('insurance_type_options').select('*').order('name'),
        supabase.from('patient_status_options').select('*').order('name')
      ]);

      if (diagnosis.data) setDiagnosisOptions(diagnosis.data);
      if (hospital.data) setHospitalOptions(hospital.data);
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
    } catch (error) {
      console.error('Error fetching package data:', error);
    }
  };

  const handleSyncPackage = () => {
    if (!selectedPatientDetail?.customer_number) {
      console.error('고객번호가 없어 패키지 정보를 가져올 수 없습니다.');
      return;
    }

    setSyncingPackage(true);
    
    const data = {
      customerNumber: selectedPatientDetail.customer_number,
      patientId: selectedPatientDetail.id,
      appUrl: window.location.origin + '/daily-tracking'
    };
    
    localStorage.setItem('crm_package_search', JSON.stringify(data));
    
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const crmUrl = `http://192.168.1.101/html/MEDI20/main.html#package_data=${encoded}`;
    
    window.open(crmUrl, '_blank');
    
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
        console.error('패키지 데이터를 받지 못했습니다.');
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
      const { error: transactionsError } = await supabase
        .from('package_transactions')
        .delete()
        .eq('patient_id', selectedPatientDetail.id);

      if (transactionsError) throw transactionsError;

      const { error: managementError } = await supabase
        .from('package_management')
        .delete()
        .eq('patient_id', selectedPatientDetail.id);

      if (managementError) throw managementError;

      const { error: paymentResetError } = await supabase
        .from('patients')
        .update({ payment_amount: 0 })
        .eq('id', selectedPatientDetail.id);

      if (paymentResetError) throw paymentResetError;

      setPackageData(null);
      setPackageTransactions([]);

      const { data: updatedPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', selectedPatientDetail.id)
        .single();
      
      if (updatedPatient) {
        setSelectedPatientDetail(updatedPatient);
      }

      console.log('패키지 데이터가 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting package data:', error);
    }
  };

  const handlePackageDataReceived = async (data: any) => {
    if (!data || !data.customerNumber) {
      console.error('Invalid package data received:', data);
      setSyncingPackage(false);
      return;
    }

    try {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('customer_number', data.customerNumber)
        .maybeSingle();

      if (patientError) throw patientError;
      if (!patient) {
        console.error('해당 고객번호의 환자를 찾을 수 없습니다.');
        setSyncingPackage(false);
        return;
      }

      const { data: existingTransactions, error: fetchError } = await supabase
        .from('package_transactions')
        .select('transaction_date, transaction_type, amount, count')
        .eq('patient_id', patient.id);

      if (fetchError) throw fetchError;

      const existingKeys = new Set(
        (existingTransactions || []).map(t => 
          `${t.transaction_date}_${t.transaction_type}_${t.amount}_${t.count}`
        )
      );

      const transactionsToInsert: any[] = [];
      const parseKoreanDate = (dateStr: string): string => {
        try {
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
          const cleaned = dateStr.replace(/[^0-9]/g, '');
          if (cleaned.length === 8) {
            return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6, 8)}`;
          }
          if (cleaned.length === 6) {
            const yy = cleaned.substring(0, 2);
            const year = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`;
            return `${year}-${cleaned.substring(2, 4)}-${cleaned.substring(4, 6)}`;
          }
          return new Date().toISOString().split('T')[0];
        } catch (error) {
          return new Date().toISOString().split('T')[0];
        }
      };

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
          if (!existingKeys.has(key)) transactionsToInsert.push(transaction);
        }
      });

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
          if (!existingKeys.has(key)) transactionsToInsert.push(transaction);
        }
      });

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
          if (!existingKeys.has(key)) transactionsToInsert.push(transaction);
        }
      });

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
          if (!existingKeys.has(key)) transactionsToInsert.push(transaction);
        }
      });

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
          if (!existingKeys.has(key)) transactionsToInsert.push(transaction);
        }
      });

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
          if (!existingKeys.has(key)) transactionsToInsert.push(transaction);
        }
      });

      if (transactionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('package_transactions')
          .insert(transactionsToInsert);

        if (insertError) throw insertError;
      }

      const { data: allTransactions, error: allError } = await supabase
        .from('package_transactions')
        .select('transaction_type, amount, count')
        .eq('patient_id', patient.id);

      if (allError) throw allError;

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

      const { error: upsertError } = await supabase
        .from('package_management')
        .upsert(packagePayload, { onConflict: 'patient_id' });

      if (upsertError) throw upsertError;

      const { error: paymentUpdateError } = await supabase
        .from('patients')
        .update({ payment_amount: depositTotal })
        .eq('id', patient.id);

      if (paymentUpdateError) throw paymentUpdateError;

      if (selectedPatientDetail?.id === patient.id) {
        await fetchPackageData(patient.id);
        
        setSelectedPatientDetail(null);
        setTimeout(async () => {
          const { data: updatedPatient } = await supabase
            .from('patients')
            .select('*')
            .eq('id', patient.id)
            .single();
          
          if (updatedPatient) {
            setSelectedPatientDetail(updatedPatient);
            await calculatePatientStats(patient.id);
          }
        }, 100);
      }
      
      setSyncingPackage(false);
    } catch (error) {
      console.error('Error saving package data:', error);
      setSyncingPackage(false);
    }
  };

  const updateEditingField = (field: string, value: any) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
    setSelectedPatientDetail((prev: any) => prev ? { ...prev, [field]: value } : null);
  };

  const saveAllEditingFields = async () => {
    if (!selectedPatientDetail || Object.keys(editingFields).length === 0) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update(editingFields)
        .eq('id', selectedPatientDetail.id);

      if (error) throw error;

      // 업데이트된 환자 정보 다시 조회 (모든 필드 포함)
      const { data: updatedPatient, error: fetchError } = await supabase
        .from('patients')
        .select(`
          *,
          admission_cycles (
            id, admission_date, discharge_date, admission_type, status
          )
        `)
        .eq('id', selectedPatientDetail.id)
        .single();

      if (fetchError) throw fetchError;

      if (updatedPatient) {
        // 모달의 환자 정보 업데이트
        setSelectedPatientDetail(updatedPatient);
        
        // 부모 컴포넌트의 patients 배열에서도 해당 환자 정보 업데이트
        const updatedPatients = patients.map(p => 
          p.id === updatedPatient.id ? updatedPatient : p
        );
        
        // 패키지 데이터 다시 조회
        await fetchPackageData(selectedPatientDetail.id);
        await calculatePatientStats(selectedPatientDetail.id);
      }

      setEditingFields({});

      // 성공 메시지를 사용자에게 표시
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
      toast.textContent = '✅ 환자 정보가 저장되었습니다.';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 2000);

    } catch (error) {
      console.error('Error updating patient fields:', error);
      
      // 오류 메시지 표시
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
      toast.textContent = '❌ 저장에 실패했습니다.';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 2000);
    }
  };
  
  const statusColors = {
    '입원': 'destructive',
    '퇴원': 'secondary',
    '재원': 'default',
    '낮병동': 'outline',
    '외래': 'default',
    '기타': 'secondary',
    '전화F/U': 'outline'
  } as const;

  const getStatusForDate = (patientId: string, date: string) => {
    return dailyStatuses.find(
      status => status.patient_id === patientId && status.status_date === date
    );
  };

  // 해당 날짜가 입원 기간 내인지 admission_cycles 및 daily_patient_status 데이터로 확인
  const getAdmissionStatusForDate = (patient: Patient, date: string) => {
    // 1. admission_cycles로 입원 기간 확인 (가장 정확함)
    if (patient.admission_cycles && patient.admission_cycles.length > 0) {
      for (const cycle of patient.admission_cycles) {
        const admissionDate = cycle.admission_date;
        const dischargeDate = cycle.discharge_date;
        
        // 입원 날짜부터 퇴원 날짜(또는 현재)까지의 기간에 해당 날짜가 포함되는지 확인
        if (date >= admissionDate) {
          if (!dischargeDate || date <= dischargeDate) {
            // 입원 중인 기간
            return {
              type: cycle.admission_type || '입원',
              isOngoing: !dischargeDate || date < dischargeDate
            };
          }
        }
      }
    }

    // 2. admission_cycles에 정보가 없으면 daily_patient_status로 추론
    const patientStatuses = dailyStatuses
      .filter(s => s.patient_id === patient.id)
      .sort((a, b) => a.status_date.localeCompare(b.status_date));

    if (patientStatuses.length === 0) return null;

    // 해당 날짜 이전의 가장 최근 입원/재원/퇴원 상태 찾기
    let lastAdmissionDate: string | null = null;
    let lastDischargeDate: string | null = null;
    let admissionType = '입원';

    for (const status of patientStatuses) {
      if (status.status_date > date) break;

      if (status.status_type === '입원' || status.status_type === '재원') {
        if (!lastAdmissionDate || status.status_date > lastAdmissionDate) {
          lastAdmissionDate = status.status_date;
          admissionType = status.status_type;
        }
        // 입원/재원이 나오면 이전 퇴원 기록 무효화
        if (lastDischargeDate && status.status_date > lastDischargeDate) {
          lastDischargeDate = null;
        }
      } else if (status.status_type === '퇴원') {
        lastDischargeDate = status.status_date;
      }
    }

    // 입원 기록이 있고, 퇴원하지 않았거나 입원이 퇴원보다 최근이면 입원 중
    if (lastAdmissionDate) {
      if (!lastDischargeDate || lastAdmissionDate > lastDischargeDate) {
        return {
          type: admissionType,
          isOngoing: true
        };
      }
    }

    return null;
  };

  // 배경색 결정
  const getBackgroundColor = (admissionStatus: { type: string; isOngoing: boolean } | null) => {
    if (!admissionStatus) return '';
    
    switch (admissionStatus.type) {
      case '입원':
      case '재원':
        return 'bg-red-100 dark:bg-red-950/30';
      case '낮병동':
        return 'bg-yellow-100 dark:bg-yellow-950/30';
      case '외래':
        return 'bg-green-100 dark:bg-green-950/30';
      default:
        return 'bg-blue-100 dark:bg-blue-950/30';
    }
  };

  const handleCellClick = (patientId: string, day: number, patient: Patient) => {
    const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
    const existingStatus = getStatusForDate(patientId, date);
    
    setSelectedCell({ patientId, date, patient });
    setSelectedStatus(existingStatus?.status_type || '');
    setNotes(existingStatus?.notes || '');
  };

  const handleSave = async () => {
    if (!selectedCell || !selectedStatus) return;

    // 현재 스크롤 위치 저장
    if (tableScrollRef.current) {
      const currentScroll = tableScrollRef.current.scrollLeft;
      setSavedScrollPosition(currentScroll);
      console.log('Saving scroll position:', currentScroll);
    }

    await onStatusUpdate(selectedCell.patientId, selectedCell.date, selectedStatus, notes);
    setSelectedCell(null);
    setSelectedStatus('');
    setNotes('');
  };

  const handleDelete = async () => {
    if (!selectedCell) return;

    // 현재 스크롤 위치 저장
    if (tableScrollRef.current) {
      const currentScroll = tableScrollRef.current.scrollLeft;
      setSavedScrollPosition(currentScroll);
      console.log('Saving scroll position:', currentScroll);
    }

    // 빈 상태로 업데이트하여 삭제 효과
    await onStatusUpdate(selectedCell.patientId, selectedCell.date, '', '');
    setSelectedCell(null);
    setSelectedStatus('');
    setNotes('');
  };

  const handleMemoDoubleClick = (patientId: string, memoType: 'memo1' | 'memo2', currentValue: string) => {
    setMemoCell({ patientId, memoType, currentValue });
    setMemoValue(currentValue);
  };

  const handleMemoSave = async () => {
    if (!memoCell) return;
    
    // 현재 스크롤 위치 저장
    if (tableScrollRef.current) {
      const currentScroll = tableScrollRef.current.scrollLeft;
      setSavedScrollPosition(currentScroll);
      console.log('Saving scroll position before memo save:', currentScroll);
    }
    
    console.log('Saving memo:', memoCell, memoValue);
    await onMemoUpdate(memoCell.patientId, memoCell.memoType, memoValue);
    
    // 모달이 열려있고 해당 환자의 메모를 수정한 경우, DB에서 최신 데이터 다시 가져오기
    if (selectedPatientDetail && selectedPatientDetail.id === memoCell.patientId) {
      console.log('Updating modal with new memo value...');
      const { data: updatedPatient } = await supabase
        .from('patients')
        .select(`
          *,
          admission_cycles (
            id,
            admission_date,
            discharge_date,
            admission_type,
            status
          )
        `)
        .eq('id', memoCell.patientId)
        .single();
      
      if (updatedPatient) {
        console.log('Updated patient after memo save:', updatedPatient);
        setSelectedPatientDetail(updatedPatient as any);
      }
    }
    
    setMemoCell(null);
    setMemoValue('');
  };

  const getDayOfWeek = (day: number) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return dayNames[date.getDay()];
  };

  // 환자 통계 계산
  const calculatePatientStats = async (patientId: string) => {
    try {
      // 해당 환자의 모든 상태 데이터 (날짜순 정렬)
      const patientStatuses = dailyStatuses
        .filter(s => s.patient_id === patientId)
        .sort((a, b) => a.status_date.localeCompare(b.status_date));
      
      // 당월 데이터 필터링
      const [year, month] = yearMonth.split('-');
      const monthStart = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      const currentMonthStatuses = patientStatuses.filter(
        s => s.status_date >= monthStart && s.status_date <= monthEnd
      );

      // 입원일수 계산 함수 (입원일부터 퇴원일까지의 기간, 월 범위 제한 가능)
      const calculateAdmissionDays = (statuses: typeof patientStatuses, limitStart?: string, limitEnd?: string) => {
        let totalDays = 0;
        let admissionDate: string | null = null;

        for (const status of statuses) {
          if (status.status_type === '입원' || status.status_type === '재원') {
            if (!admissionDate) {
              admissionDate = status.status_date;
            }
          } else if (status.status_type === '퇴원' && admissionDate) {
            // 입원일부터 퇴원일까지의 일수 계산 (퇴원일 포함)
            let startDate = admissionDate;
            let endDate = status.status_date;
            
            // 월 범위 제한이 있으면 적용
            if (limitStart && startDate < limitStart) {
              startDate = limitStart;
            }
            if (limitEnd && endDate > limitEnd) {
              endDate = limitEnd;
            }
            
            // 범위 내에 있을 때만 계산
            if (startDate <= endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              totalDays += days;
            }
            
            admissionDate = null;
          }
        }

        // 퇴원하지 않은 입원이 있으면 오늘까지 또는 월말까지 계산
        if (admissionDate) {
          let startDate = admissionDate;
          let endDate = new Date().toISOString().split('T')[0];
          
          // 월 범위 제한이 있으면 적용
          if (limitStart && startDate < limitStart) {
            startDate = limitStart;
          }
          if (limitEnd && endDate > limitEnd) {
            endDate = limitEnd;
          }
          
          // 범위 내에 있을 때만 계산
          if (startDate <= endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            totalDays += days;
          }
        }

        return totalDays;
      };

      // 당월 통계 계산 (해당 월 범위 내로 제한)
      const currentMonthStats = {
        admissionDays: calculateAdmissionDays(patientStatuses, monthStart, monthEnd),
        dayCare: currentMonthStatuses.filter(s => s.status_type === '낮병동').length,
        outpatient: currentMonthStatuses.filter(s => s.status_type === '외래').length,
        phoneFollowUp: currentMonthStatuses.filter(s => s.status_type === '전화F/U').length,
        revenue: 0
      };

      // 전체 통계 계산 (제한 없음)
      const totalStats = {
        admissionDays: calculateAdmissionDays(patientStatuses),
        dayCare: patientStatuses.filter(s => s.status_type === '낮병동').length,
        outpatient: patientStatuses.filter(s => s.status_type === '외래').length,
        phoneFollowUp: patientStatuses.filter(s => s.status_type === '전화F/U').length,
        revenue: 0
      };

      // 수납 완료 매출 계산
      const { data: treatmentPlans } = await supabase
        .from('treatment_plans')
        .select('treatment_amount, payment_date, is_paid')
        .eq('patient_id', patientId)
        .eq('is_paid', true);

      // 환자의 payment_amount 가져오기 (패키지 예치금 입금 총액)
      const { data: patientData } = await supabase
        .from('patients')
        .select('payment_amount')
        .eq('id', patientId)
        .single();

      const paymentAmount = patientData?.payment_amount || 0;

      if (treatmentPlans) {
        // 당월 매출 = 당월 treatment_plans + payment_amount
        currentMonthStats.revenue = treatmentPlans
          .filter(tp => tp.payment_date && tp.payment_date >= monthStart && tp.payment_date <= monthEnd)
          .reduce((sum, tp) => sum + (tp.treatment_amount || 0), 0) + paymentAmount;

        // 전체 매출 = 전체 treatment_plans + payment_amount
        totalStats.revenue = treatmentPlans.reduce((sum, tp) => sum + (tp.treatment_amount || 0), 0) + paymentAmount;
      } else {
        // treatment_plans가 없어도 payment_amount는 포함
        currentMonthStats.revenue = paymentAmount;
        totalStats.revenue = paymentAmount;
      }

      setPatientStats({
        currentMonth: currentMonthStats,
        total: totalStats
      });
    } catch (error) {
      console.error('Error calculating patient stats:', error);
    }
  };

  const renderDayHeaders = () => {
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const hasFilter = dateFilters[day] && dateFilters[day].length > 0;
      
      days.push(
        <th key={day} className="min-w-[60px] p-1 text-center text-xs font-medium border bg-muted">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <span>{day}({getDayOfWeek(day)})</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-5 w-5 p-0",
                      hasFilter && "text-primary"
                    )}
                    title="필터"
                  >
                    <Filter className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3 z-50" align="start">
                  <div className="space-y-2">
                    <div className="font-medium text-sm mb-2">
                      {day}일 상태 필터
                    </div>
                    <div className="space-y-2">
                      {statusTypes.map((statusType) => {
                        const isChecked = dateFilters[day]?.includes(statusType) || false;
                        return (
                          <div key={statusType} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-${day}-${statusType}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                setDateFilters(prev => {
                                  const current = prev[day] || [];
                                  if (checked) {
                                    return {
                                      ...prev,
                                      [day]: [...current, statusType]
                                    };
                                  } else {
                                    const filtered = current.filter(s => s !== statusType);
                                    if (filtered.length === 0) {
                                      const { [day]: _, ...rest } = prev;
                                      return rest;
                                    }
                                    return {
                                      ...prev,
                                      [day]: filtered
                                    };
                                  }
                                });
                              }}
                            />
                            <label
                              htmlFor={`filter-${day}-${statusType}`}
                              className="text-sm cursor-pointer"
                            >
                              {statusType}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    {hasFilter && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => {
                          setDateFilters(prev => {
                            const { [day]: _, ...rest } = prev;
                            return rest;
                          });
                        }}
                      >
                        필터 초기화
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {hasFilter && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                {dateFilters[day].length}개
              </Badge>
            )}
          </div>
        </th>
      );
    }
    return days;
  };

  // 스크롤 위치 복원 (useLayoutEffect로 DOM 업데이트 직후 실행)
  useLayoutEffect(() => {
    if (savedScrollPosition > 0 && tableScrollRef.current) {
      console.log('Immediate scroll restore to:', savedScrollPosition);
      tableScrollRef.current.scrollLeft = savedScrollPosition;
    }
  }, [dailyStatuses, patients]); // patients도 의존성에 추가

  // 스크롤 위치 복원 (여러 번 시도하여 확실하게)
  useEffect(() => {
    if (tableScrollRef.current && savedScrollPosition > 0) {
      console.log('Restoring scroll position:', savedScrollPosition);
      
      // 즉시 실행
      tableScrollRef.current.scrollLeft = savedScrollPosition;
      
      // 여러 시점에서 재시도 (브라우저 렌더링 완료 후)
      const timeoutIds = [0, 10, 50, 100, 200, 300, 500].map(delay => 
        setTimeout(() => {
          if (tableScrollRef.current && tableScrollRef.current.scrollLeft !== savedScrollPosition) {
            tableScrollRef.current.scrollLeft = savedScrollPosition;
            console.log(`Scroll restored to: ${savedScrollPosition} (after ${delay}ms)`);
          }
        }, delay)
      );
      
      return () => {
        timeoutIds.forEach(id => clearTimeout(id));
      };
    }
  }, [dailyStatuses, savedScrollPosition, patients]); // patients도 의존성에 추가

  // 마우스 드래그 스크롤 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tableScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableScrollRef.current.offsetLeft);
    setScrollLeft(tableScrollRef.current.scrollLeft);
    tableScrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    if (!tableScrollRef.current) return;
    setIsDragging(false);
    tableScrollRef.current.style.cursor = 'grab';
  };

  const handleMouseUp = () => {
    if (!tableScrollRef.current) return;
    setIsDragging(false);
    tableScrollRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도 조절
    tableScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const renderPatientRow = (patient: Patient) => {
    const cells = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
      const status = getStatusForDate(patient.id, date);
      const admissionStatus = getAdmissionStatusForDate(patient, date);
      
      // 해당 날짜에 입원/재원 상태가 직접 입력된 경우 체크
      const hasDirectAdmissionStatus = status && ['입원', '재원'].includes(status.status_type);
      
      // 배경색 결정: 낮병동/외래는 직접 입력된 경우 배경색 적용
      let bgColor = '';
      if (status && status.status_type === '낮병동') {
        bgColor = 'bg-yellow-100 dark:bg-yellow-950/30';
      } else if (status && status.status_type === '외래') {
        bgColor = 'bg-green-100 dark:bg-green-950/30';
      } else {
        bgColor = (!hasDirectAdmissionStatus && admissionStatus) ? getBackgroundColor(admissionStatus) : '';
      }
      
      // 입원 기간 내 재원/입원 상태는 배경색으로만 표시 (중복 방지)
      const shouldShowStatus = status && !(
        admissionStatus && 
        !hasDirectAdmissionStatus &&
        (status.status_type === '재원' || status.status_type === '입원')
      );
      
      cells.push(
        <td key={day} className={`p-0.5 border ${bgColor}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-full p-0.5 text-xs bg-transparent hover:bg-black/5 dark:hover:bg-white/5 relative"
            onClick={() => handleCellClick(patient.id, day, patient)}
          >
            {/* 날짜 표시 (왼쪽 상단에 옅게) */}
            <span className="absolute top-0.5 left-0.5 text-[8px] text-muted-foreground/40">
              {day}
            </span>
            
            {shouldShowStatus && (
              <div className="flex flex-col items-center gap-0.5">
                {status.status_type === '관리 중' ? (
                  <span className="text-xs font-medium">돌환</span>
                ) : (
                  <>
                    <Badge
                      variant={statusColors[status.status_type as keyof typeof statusColors] || 'default'}
                      className="text-[10px] px-1 py-0"
                    >
                      {status.status_type}
                    </Badge>
                    {status.notes && (
                      <span className="text-[9px] text-muted-foreground truncate max-w-full">
                        {status.notes.substring(0, 10)}...
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </Button>
        </td>
      );
    }
    
    return cells;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium">상태 범례:</span>
        <div className="flex items-center gap-1">
          <div className="w-8 h-6 bg-red-100 dark:bg-red-950/30 border rounded"></div>
          <span className="text-xs">입원/재원</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-6 bg-yellow-100 dark:bg-yellow-950/30 border rounded"></div>
          <span className="text-xs">낮병동</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-6 bg-green-100 dark:bg-green-950/30 border rounded"></div>
          <span className="text-xs">외래</span>
        </div>
        {statusTypes.map(statusType => (
          <Badge
            key={statusType}
            variant={statusColors[statusType as keyof typeof statusColors] || 'default'}
            className="text-xs"
          >
            {statusType}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onPreviousMonth}
          aria-label="이전 월"
          className="flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div 
          ref={tableScrollRef} 
          className="overflow-x-auto select-none scrollbar-hide flex-1"
          style={{ cursor: 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <table className="min-w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="min-w-[100px] p-2 text-left font-medium border sticky left-0 bg-muted z-10">
                환자명
              </th>
              <th className="min-w-[120px] p-2 text-left font-medium border">
                메모
              </th>
              {renderDayHeaders()}
            </tr>
          </thead>
          <tbody>
            {patients.filter((patient) => {
              // 필터가 하나라도 설정되어 있으면 필터링 적용
              if (Object.keys(dateFilters).length === 0) return true;
              
              // 각 필터링된 날짜에 대해 체크
              for (const [dayStr, selectedStatuses] of Object.entries(dateFilters)) {
                const day = parseInt(dayStr);
                const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
                const status = getStatusForDate(patient.id, date);
                const admissionStatus = getAdmissionStatusForDate(patient, date);
                
                // 해당 날짜에 선택된 상태 중 하나라도 있으면 표시
                for (const selectedStatus of selectedStatuses) {
                  // 직접 입력된 상태 체크
                  if (status && status.status_type === selectedStatus) {
                    return true;
                  }
                  
                  // 입원 기간 기반 상태 체크 (입원/재원)
                  if (!status || !['입원', '재원'].includes(status.status_type)) {
                    if (admissionStatus) {
                      if (selectedStatus === '입원' && admissionStatus.type === '입원') {
                        return true;
                      }
                      if (selectedStatus === '재원' && admissionStatus.type === '재원') {
                        return true;
                      }
                    }
                  }
                }
              }
              
              return false;
            }).map((patient, index) => {
              return (
                <tr key={patient.id} className="hover:bg-muted/50">
                  <td className="p-2 border sticky left-0 bg-background">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <div 
                          className="font-medium cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            setSelectedPatientDetail(patient);
                            setEditingManagementStatus(patient.management_status || '관리 중');
                            calculatePatientStats(patient.id);
                            fetchPackageData(patient.id);
                          }}
                        >
                          {patient.name}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBulkSchedule(patient);
                          }}
                          title="일괄 스케줄 등록"
                        >
                          <CalendarDays className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        담당: {patient.manager_name || '-'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        진단: {patient.diagnosis || '-'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={
                          patient.management_status === '아웃' ? 'destructive' :
                          patient.management_status === '아웃위기' ? 'default' :
                          'secondary'
                        } className="text-[9px] px-1 py-0">
                          {patient.management_status || '관리 중'}
                        </Badge>
                        <div className="flex flex-col gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-3 w-3 p-0"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-3 w-3 p-0"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === patients.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td 
                    className="p-2 border text-xs cursor-pointer hover:bg-muted/50"
                    onDoubleClick={() => handleMemoDoubleClick(patient.id, 'memo1', patient.memo1 || '')}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate max-w-[120px]">
                            {patient.memo1 || '-'}
                          </div>
                        </TooltipTrigger>
                        {patient.memo1 && (
                          <TooltipContent className="max-w-[300px] max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                            <p>{patient.memo1}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  {renderPatientRow(patient)}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        <Button 
          variant="outline" 
          size="icon"
          onClick={onNextMonth}
          aria-label="다음 월"
          className="flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 상태 편집 다이얼로그 */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCell?.patient.name} - {selectedCell?.date} 상태
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">상태 선택</Label>
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  // 상태 변경 시 메모 초기화 (기타/전화F/U가 아닌 경우)
                  if (value !== '기타' && value !== '전화F/U') {
                    setNotes('');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  {statusTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(selectedStatus === '기타' || selectedStatus === '전화F/U') && (
              <div>
                <Label htmlFor="notes">메모 {selectedStatus === '기타' ? '(기타)' : '(전화F/U)'}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  rows={3}
                />
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="destructive" onClick={handleDelete}>
                삭제
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedCell(null)}>
                  취소
                </Button>
                <Button onClick={handleSave} disabled={!selectedStatus}>
                  저장
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 메모 편집 다이얼로그 */}
      <Dialog open={!!memoCell} onOpenChange={() => setMemoCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              메모 편집
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="memo">메모 내용</Label>
              <Textarea
                id="memo"
                value={memoValue}
                onChange={(e) => setMemoValue(e.target.value)}
                placeholder="메모를 입력하세요..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMemoCell(null)}>
                취소
              </Button>
              <Button onClick={handleMemoSave}>
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 환자 상세정보 다이얼로그 */}
      <Dialog open={!!selectedPatientDetail} onOpenChange={() => {
        setSelectedPatientDetail(null);
        setEditingFields({});
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPatientDetail?.name} - 환자 상세정보
            </DialogTitle>
          </DialogHeader>
          
          {selectedPatientDetail && (
            <div className="space-y-6 mt-4">
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
                      value={selectedPatientDetail?.diagnosis_detail || ''}
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

                  {/* 특이사항1 */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label>특이사항1</Label>
                    <Textarea
                      value={selectedPatientDetail?.special_note_1 || ''}
                      disabled
                      className="bg-muted"
                      rows={3}
                    />
                  </div>

                  {/* 특이사항2 */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label>특이사항2</Label>
                    <Textarea
                      value={selectedPatientDetail?.special_note_2 || ''}
                      disabled
                      className="bg-muted"
                      rows={3}
                    />
                  </div>

                  {/* 진료메모1 */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label>진료메모1</Label>
                    <Textarea
                      value={selectedPatientDetail?.treatment_memo_1 || ''}
                      disabled
                      className="bg-muted"
                      rows={3}
                    />
                  </div>

                  {/* 진료메모2 */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label>진료메모2</Label>
                    <Textarea
                      value={selectedPatientDetail?.treatment_memo_2 || ''}
                      disabled
                      className="bg-muted"
                      rows={3}
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

                  {/* 상담일 */}
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

                  {/* 유입일 */}
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
                      onValueChange={(value) => {
                        updateEditingField('management_status', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="관리 상태를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        {patientStatusOptions.map((option: any) => (
                          <SelectItem key={option.id} value={option.name}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 실비보험 유형 */}
                  <div>
                    <Label>실비보험 유형</Label>
                    <Select
                      value={selectedPatientDetail?.insurance_type || ''}
                      onValueChange={(value) => {
                        updateEditingField('insurance_type', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        {insuranceTypeOptions.map((option: any) => (
                          <SelectItem key={option.id} value={option.name}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 본병원 치료 */}
                  <div>
                    <Label>본병원 치료</Label>
                    <Input
                      value={selectedPatientDetail?.hospital_treatment || ''}
                      onChange={(e) => updateEditingField('hospital_treatment', e.target.value)}
                      placeholder="본병원 치료 내용"
                    />
                  </div>

                  {/* 본병원 검사일정 */}
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
                      총 수납금액 (예치금 + 입원/외래 매출)
                    </p>
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
                        {selectedPatientDetail?.inflow_date 
                          ? new Date(selectedPatientDetail.inflow_date).toLocaleDateString('ko-KR')
                          : selectedPatientDetail?.created_at 
                            ? new Date(selectedPatientDetail.created_at).toLocaleDateString('ko-KR') 
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
                    disabled={Object.keys(editingFields).length === 0}
                  >
                    수정 저장
                  </Button>
                </div>
              </div>

              {/* 패키지 관리 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="text-lg font-semibold">패키지 관리</h3>
                  <Badge variant="outline">현황</Badge>
                </div>

                {!selectedPatientDetail?.customer_number ? (
                  <div className="text-center py-8 text-muted-foreground">
                    고객번호가 없어 패키지 정보를 표시할 수 없습니다.
                  </div>
                ) : packageTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    패키지 데이터가 없습니다.
                  </div>
                ) : (
                  <>
                    {/* 합계 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">예치금</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">입금:</span>
                            <span className="font-semibold">
                              {packageTransactions
                                .filter(t => t.transaction_type === 'deposit_in')
                                .reduce((sum, t) => sum + t.amount, 0)
                                .toLocaleString()}원
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">사용:</span>
                            <span className="text-red-600">
                              {packageTransactions
                                .filter(t => t.transaction_type === 'deposit_out')
                                .reduce((sum, t) => sum + t.amount, 0)
                                .toLocaleString()}원
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-sm font-semibold">잔액:</span>
                            <span className="text-lg font-bold text-primary">
                              {(packageTransactions
                                .filter(t => t.transaction_type === 'deposit_in')
                                .reduce((sum, t) => sum + t.amount, 0) -
                              packageTransactions
                                .filter(t => t.transaction_type === 'deposit_out')
                                .reduce((sum, t) => sum + t.amount, 0))
                                .toLocaleString()}원
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
                            <span className="font-semibold">
                              {packageTransactions
                                .filter(t => t.transaction_type === 'reward_in')
                                .reduce((sum, t) => sum + t.amount, 0)
                                .toLocaleString()}원
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">사용:</span>
                            <span className="text-red-600">
                              {packageTransactions
                                .filter(t => t.transaction_type === 'reward_out')
                                .reduce((sum, t) => sum + t.amount, 0)
                                .toLocaleString()}원
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-sm font-semibold">잔액:</span>
                            <span className="text-lg font-bold text-primary">
                              {(packageTransactions
                                .filter(t => t.transaction_type === 'reward_in')
                                .reduce((sum, t) => sum + t.amount, 0) -
                              packageTransactions
                                .filter(t => t.transaction_type === 'reward_out')
                                .reduce((sum, t) => sum + t.amount, 0))
                                .toLocaleString()}원
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
                            <span className="font-semibold">
                              {packageTransactions
                                .filter(t => t.transaction_type === 'count_in')
                                .reduce((sum, t) => sum + t.count, 0)}회
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">사용:</span>
                            <span className="text-red-600">
                              {packageTransactions
                                .filter(t => t.transaction_type === 'count_out')
                                .reduce((sum, t) => sum + t.count, 0)}회
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-sm font-semibold">잔여:</span>
                            <span className="text-lg font-bold text-primary">
                              {packageTransactions
                                .filter(t => t.transaction_type === 'count_in')
                                .reduce((sum, t) => sum + t.count, 0) -
                              packageTransactions
                                .filter(t => t.transaction_type === 'count_out')
                                .reduce((sum, t) => sum + t.count, 0)}회
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {packageData?.last_synced_at && (
                      <div className="text-xs text-muted-foreground text-right">
                        마지막 동기화: {new Date(packageData.last_synced_at).toLocaleString('ko-KR')}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 입원 매출 현황 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="text-lg font-semibold">입원 매출</h3>
                  <Badge variant="outline">현황</Badge>
                </div>

                {packageTransactions.filter(t => t.transaction_type === 'inpatient_revenue').length > 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">총 건수:</span>
                          <span className="font-semibold">
                            {packageTransactions.filter(t => t.transaction_type === 'inpatient_revenue').length}건
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm font-semibold">합계:</span>
                          <span className="text-lg font-bold text-primary">
                            {packageTransactions
                              .filter(t => t.transaction_type === 'inpatient_revenue')
                              .reduce((sum, t) => sum + t.amount, 0)
                              .toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    입원 매출 데이터가 없습니다.
                  </div>
                )}
              </div>

              {/* 외래 매출 현황 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="text-lg font-semibold">외래 매출</h3>
                  <Badge variant="outline">현황</Badge>
                </div>

                {packageTransactions.filter(t => t.transaction_type === 'outpatient_revenue').length > 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">총 건수:</span>
                          <span className="font-semibold">
                            {packageTransactions.filter(t => t.transaction_type === 'outpatient_revenue').length}건
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm font-semibold">합계:</span>
                          <span className="text-lg font-bold text-primary">
                            {packageTransactions
                              .filter(t => t.transaction_type === 'outpatient_revenue')
                              .reduce((sum, t) => sum + t.amount, 0)
                              .toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    외래 매출 데이터가 없습니다.
                  </div>
                )}
              </div>

              {/* 활동 통계 정보 */}
              {patientStats && (
                <div className="space-y-3">
                  <h3 className="font-semibold">활동 통계</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 당월 통계 */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">당월</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">입원일수</span>
                          <span className="font-medium">{patientStats.currentMonth.admissionDays}일</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">낮병동</span>
                          <span className="font-medium">{patientStats.currentMonth.dayCare}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">외래</span>
                          <span className="font-medium">{patientStats.currentMonth.outpatient}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">전화F/U</span>
                          <span className="font-medium">{patientStats.currentMonth.phoneFollowUp}회</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">매출</span>
                          <span className="font-semibold text-primary">
                            {patientStats.currentMonth.revenue.toLocaleString()}원
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 총 통계 */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">총 누적</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">입원일수</span>
                          <span className="font-medium">{patientStats.total.admissionDays}일</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">낮병동</span>
                          <span className="font-medium">{patientStats.total.dayCare}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">외래</span>
                          <span className="font-medium">{patientStats.total.outpatient}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">전화F/U</span>
                          <span className="font-medium">{patientStats.total.phoneFollowUp}회</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">매출</span>
                          <span className="font-semibold text-primary">
                            {patientStats.total.revenue.toLocaleString()}원
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* 닫기 버튼 */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setSelectedPatientDetail(null);
                  setEditingFields({});
                }}>
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 일괄 스케줄 등록 다이얼로그 */}
      <Dialog open={bulkScheduleDialog.open} onOpenChange={handleCloseBulkSchedule}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bulkScheduleDialog.patient?.name} - 일괄 스케줄 등록
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 상태 선택 */}
            <div>
              <Label>상태 선택</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {statusTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 날짜 선택 */}
            <div>
              <Label>날짜 선택 (여러 개 선택 가능)</Label>
              <div className="grid grid-cols-7 gap-2 mt-2 p-4 border rounded-lg max-h-[300px] overflow-y-auto">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const isSelected = selectedDates.has(day);
                  return (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleDate(day)}
                      />
                      <label
                        htmlFor={`day-${day}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {day}일
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                선택된 날짜: {selectedDates.size}개
              </div>
            </div>

            {/* 메모 입력 (선택사항) */}
            {(bulkStatus === '기타' || bulkStatus === '전화F/U') && (
              <div>
                <Label>메모 (선택사항)</Label>
                <Textarea
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="메모를 입력하세요"
                  rows={3}
                />
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseBulkSchedule}>
                취소
              </Button>
              <Button 
                onClick={handleBulkScheduleSubmit}
                disabled={selectedDates.size === 0 || !bulkStatus}
              >
                선택한 날짜에 모두 적용
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}