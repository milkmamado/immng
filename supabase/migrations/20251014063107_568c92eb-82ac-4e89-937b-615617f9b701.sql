-- 패키지 관리 테이블 생성
CREATE TABLE IF NOT EXISTS public.package_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  customer_number TEXT,
  
  -- 예수금 정보
  deposit_total NUMERIC DEFAULT 0,
  deposit_used NUMERIC DEFAULT 0,
  deposit_balance NUMERIC DEFAULT 0,
  
  -- 적립금 정보
  reward_total NUMERIC DEFAULT 0,
  reward_used NUMERIC DEFAULT 0,
  reward_balance NUMERIC DEFAULT 0,
  
  -- 횟수 정보
  count_total INTEGER DEFAULT 0,
  count_used INTEGER DEFAULT 0,
  count_balance INTEGER DEFAULT 0,
  
  -- 메타 정보
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- 환자당 하나의 패키지 관리 레코드만 존재
  UNIQUE(patient_id)
);

-- RLS 정책 활성화
ALTER TABLE public.package_management ENABLE ROW LEVEL SECURITY;

-- 매니저는 자신이 담당하는 환자의 패키지 관리 조회 가능
CREATE POLICY "Managers can view package management for their patients"
  ON public.package_management
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = package_management.patient_id
        AND patients.assigned_manager = auth.uid()
    )
  );

-- 매니저는 자신이 담당하는 환자의 패키지 관리 수정 가능
CREATE POLICY "Managers can manage package management for their patients"
  ON public.package_management
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = package_management.patient_id
        AND patients.assigned_manager = auth.uid()
    )
  );

-- 마스터는 모든 패키지 관리 조회 가능
CREATE POLICY "Masters can view all package management"
  ON public.package_management
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'master'
        AND ur.approval_status = 'approved'
    )
  );

-- 관리자는 모든 패키지 관리 조회 가능
CREATE POLICY "Admins can view all package management"
  ON public.package_management
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.approval_status = 'approved'
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_package_management_updated_at
  BEFORE UPDATE ON public.package_management
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 인덱스 생성
CREATE INDEX idx_package_management_patient_id ON public.package_management(patient_id);
CREATE INDEX idx_package_management_last_synced ON public.package_management(last_synced_at);