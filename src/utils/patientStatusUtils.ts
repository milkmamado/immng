/**
 * 환자 상태 관리 유틸리티 함수들
 * DailyStatusTracking과 RiskManagement에서 공통으로 사용
 */

/**
 * 마지막 체크 날짜로부터 경과 일수 계산
 */
export const calculateDaysSinceLastCheck = (
  lastCheckDate: string | undefined,
  createdAt: string
): number => {
  const today = new Date();
  
  if (!lastCheckDate) {
    const createdDate = new Date(createdAt);
    return Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    const lastDate = new Date(lastCheckDate);
    return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }
};

/**
 * 경과 일수에 따른 자동 상태 계산
 * - 21일 이상: "아웃"
 * - 14~20일: "아웃위기"
 * - 14일 미만: "관리 중"
 */
export const calculateAutoManagementStatus = (
  daysSinceCheck: number
): string => {
  if (daysSinceCheck >= 21) {
    return "아웃";
  } else if (daysSinceCheck >= 14) {
    return "아웃위기";
  } else {
    return "관리 중";
  }
};

/**
 * 자동 상태 업데이트 가능 여부 확인
 * @param currentStatus 현재 환자 상태
 * @param excludeManuallySet true이면 수동 설정된 아웃/아웃위기도 제외 (RiskManagement용)
 */
export const shouldAutoUpdateStatus = (
  currentStatus: string | undefined,
  excludeManuallySet: boolean = false
): boolean => {
  const finalStatuses = ['사망', '상태악화', '치료종료'];
  
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
