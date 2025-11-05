import { useAuth } from '@/hooks/useAuth';

/**
 * 현재 지점 기반 필터를 Supabase 쿼리에 적용하는 유틸리티 hook
 * 
 * 사용 예시:
 * const { applyBranchFilter } = useBranchFilter();
 * let query = supabase.from('patients').select('*');
 * query = applyBranchFilter(query);
 */
export function useBranchFilter() {
  const { currentBranch } = useAuth();

  /**
   * Supabase 쿼리에 현재 지점 필터를 적용
   */
  const applyBranchFilter = (query: any): any => {
    if (currentBranch) {
      return query.eq('branch', currentBranch);
    }
    return query;
  };

  /**
   * 현재 지점 반환
   */
  const getCurrentBranch = () => currentBranch;

  return {
    applyBranchFilter,
    currentBranch,
    getCurrentBranch,
  };
}