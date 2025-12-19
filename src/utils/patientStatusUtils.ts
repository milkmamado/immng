/**
 * 환자 상태 관리 유틸리티 함수들
 * DailyStatusTracking과 RiskManagement에서 공통으로 사용
 */

/**
 * 단기 치료 환자 판별
 * - 부인과 수술 후 회복
 * - 척추질환
 */
export const isShortTermTreatmentPatient = (diagnosisCategory: string): boolean => {
  const shortTermCategories = ['부인과 수술 후 회복', '척추질환'];
  return shortTermCategories.includes(diagnosisCategory);
};

/**
 * 마지막 체크 날짜로부터 경과 일수 계산
 * 우선순위: last_visit_date > inflow_date > consultation_date
 * (created_at은 제외 - 데이터 품질 강제)
 */
export const calculateDaysSinceLastCheck = (
  lastCheckDate: string | undefined,
  inflowDate?: string | null,
  consultationDate?: string | null
): number | null => {
  const today = new Date();
  
  if (lastCheckDate) {
    // 1순위: last_visit_date (마지막 내원일)
    const lastDate = new Date(lastCheckDate);
    return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  } else if (inflowDate) {
    // 2순위: inflow_date (유입일)
    const inflow = new Date(inflowDate);
    return Math.floor((today.getTime() - inflow.getTime()) / (1000 * 60 * 60 * 24));
  } else if (consultationDate) {
    // 3순위: consultation_date (상담일)
    const consultation = new Date(consultationDate);
    return Math.floor((today.getTime() - consultation.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    // 유입일/상담일 모두 없으면 null 반환 (아웃 판단 불가)
    return null;
  }
};

/**
 * 경과 일수에 따른 자동 상태 계산
 * - 30일 이상: "아웃"
 * - 21~29일: "아웃위기"
 * - 21일 미만: "관리 중"
 * - null (유입일/상담일 없음): "관리 중" (기본값)
 */
export const calculateAutoManagementStatus = (
  daysSinceCheck: number | null
): string => {
  if (daysSinceCheck === null) {
    return "관리 중"; // 유입일/상담일 없으면 기본값
  }
  
  if (daysSinceCheck >= 30) {
    return "아웃";
  } else if (daysSinceCheck >= 21) {
    return "아웃위기";
  } else {
    return "관리 중";
  }
};

/**
 * 자동 상태 업데이트 가능 여부 확인
 * @param currentStatus 현재 환자 상태
 * @param excludeManuallySet true이면 수동 설정된 아웃/아웃위기도 제외 (RiskManagement용)
 * @param visitType 방문 유형 (입원 환자는 자동 업데이트 제외)
 */
export const shouldAutoUpdateStatus = (
  currentStatus: string | undefined,
  excludeManuallySet: boolean = false,
  visitType?: string | null
): boolean => {
  // 입원 환자는 자동 아웃/아웃위기 처리에서 제외
  if (visitType === '입원') {
    return false;
  }
  
  const finalStatuses = ['사망', '상태악화', '치료종료', '면책기간'];
  
  // 최종 상태는 자동 업데이트하지 않음
  if (finalStatuses.includes(currentStatus || '')) {
    return false;
  }
  
  // RiskManagement에서는 수동 설정된 아웃/아웃위기도 제외
  if (excludeManuallySet) {
    const manuallySetStatuses = ['아웃', '아웃위기'];
    if (manuallySetStatuses.includes(currentStatus || '')) {
      return false;
    }
  }
  
  // "관리 중" 상태도 경과 일수에 따라 자동으로 "아웃위기" 또는 "아웃"으로 변경됨
  // 환자가 재방문하면 last_visit_date가 업데이트되어 경과 일수가 리셋되므로
  // 자연스럽게 "관리 중"으로 복귀됨
  return true;
};
