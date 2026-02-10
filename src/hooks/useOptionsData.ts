import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * 진단 옵션 데이터를 React Query 캐시로 관리
 * staleTime: 5분 (옵션 데이터는 자주 변경되지 않음)
 */
export function useDiagnosisOptions() {
  return useQuery({
    queryKey: ['options', 'diagnosis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnosis_options')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 병원 옵션 데이터
 */
export function useHospitalOptions() {
  return useQuery({
    queryKey: ['options', 'hospital'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospital_options')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 보험 유형 옵션 데이터
 */
export function useInsuranceTypeOptions() {
  return useQuery({
    queryKey: ['options', 'insurance_type'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insurance_type_options')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 치료 상세 옵션 데이터
 */
export function useTreatmentDetailOptions() {
  return useQuery({
    queryKey: ['options', 'treatment_detail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatment_detail_options')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 환자 상태 옵션 데이터
 */
export function usePatientStatusOptions() {
  return useQuery({
    queryKey: ['options', 'patient_status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_status_options')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 현재 로그인한 사용자의 이름을 React Query 캐시로 관리
 */
export function useCurrentUserName() {
  return useQuery({
    queryKey: ['currentUserName'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      return profile?.name || '';
    },
    staleTime: 10 * 60 * 1000,
  });
}
