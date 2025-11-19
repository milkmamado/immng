import { Database } from '@/integrations/supabase/types';

type Patient = Database['public']['Tables']['patients']['Row'];

/**
 * 환자의 유입일을 계산합니다.
 * inflow_date가 있으면 사용하고, 없으면 created_at을 사용합니다.
 */
export const getPatientInflowDate = (patient: Partial<Patient>): Date => {
  return patient.inflow_date 
    ? new Date(patient.inflow_date) 
    : new Date(patient.created_at!);
};

/**
 * 선택한 월의 시작일과 종료일을 계산합니다.
 * 현재 월이면 오늘까지, 과거 월이면 해당 월 마지막 날까지
 */
export const getMonthDateRange = (selectedMonth: string): {
  startDate: Date;
  endDate: Date;
  isCurrentMonth: boolean;
} => {
  const [year, month] = selectedMonth.split('-').map(Number);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month - 1;
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = isCurrentMonth ? today : new Date(year, month, 0);
  
  return { startDate, endDate, isCurrentMonth };
};

/**
 * 환자가 선택한 월에 유입되었는지 확인합니다.
 */
export const isPatientInflowInMonth = (
  patient: Partial<Patient>, 
  startDate: Date, 
  endDate: Date
): boolean => {
  const inflowDate = getPatientInflowDate(patient);
  return inflowDate >= startDate && inflowDate <= endDate;
};

/**
 * 이전 달 문자열을 계산합니다 (YYYY-MM 형식)
 */
export const getPreviousMonth = (selectedMonth: string): string => {
  const [year, month] = selectedMonth.split('-').map(Number);
  const prevMonthDate = new Date(year, month - 2, 1);
  return `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * 관리 기간별 기준일을 계산합니다.
 */
export const getManagementPeriodCutoffDates = (selectedMonth: string) => {
  const [year, month] = selectedMonth.split('-').map(Number);
  const referenceDate = new Date(year, month, 0); // 해당 월의 마지막 날
  
  return {
    oneMonthAgo: new Date(year, month - 2, referenceDate.getDate()),
    threeMonthsAgo: new Date(year, month - 4, referenceDate.getDate()),
    sixMonthsAgo: new Date(year, month - 7, referenceDate.getDate())
  };
};

/**
 * 환자가 특정 날짜 이전에 유입되었는지 확인합니다.
 */
export const isPatientInflowBeforeDate = (
  patient: Partial<Patient>,
  cutoffDate: Date
): boolean => {
  const inflowDate = getPatientInflowDate(patient);
  return inflowDate <= cutoffDate;
};

/**
 * 통계 계산에 사용되는 환자 필터링 함수들
 */
export const patientFilters = {
  /**
   * 관리 중인 환자만 필터링
   */
  isManaged: (patient: Partial<Patient>) => 
    patient.management_status === '관리 중',

  /**
   * 아웃 환자만 필터링
   */
  isOut: (patient: Partial<Patient>) => 
    patient.management_status === '아웃',

  /**
   * 유입 상태가 '유입'인 환자만 필터링 (초진)
   */
  isInflow: (patient: Partial<Patient>) => 
    patient.inflow_status === '유입',

  /**
   * visit_type이 '초진'인 환자만 필터링
   */
  isFirstVisit: (patient: Partial<Patient>) => 
    patient.visit_type === '초진',

  /**
   * 전화상담 환자만 필터링
   */
  isPhoneConsult: (patient: Partial<Patient>) => 
    patient.inflow_status === '전화상담',

  /**
   * 방문상담 환자만 필터링
   */
  isVisitConsult: (patient: Partial<Patient>) => 
    patient.inflow_status === '방문상담',

  /**
   * 실패 환자만 필터링
   */
  isFailed: (patient: Partial<Patient>) => 
    patient.inflow_status === '실패',
};

/**
 * 통화폐 포맷팅
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
};
