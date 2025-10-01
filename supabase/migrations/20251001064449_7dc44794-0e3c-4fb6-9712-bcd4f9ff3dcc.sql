-- 1. 성능 개선을 위한 인덱스 추가
-- 매니저별 환자 조회 성능 개선 (가장 중요)
CREATE INDEX IF NOT EXISTS idx_patients_assigned_manager 
ON public.patients(assigned_manager);

-- 유입 상태별 필터링 성능 개선
CREATE INDEX IF NOT EXISTS idx_patients_inflow_status 
ON public.patients(inflow_status);

-- 복합 인덱스: 매니저 + 관리 상태 (자주 함께 사용)
CREATE INDEX IF NOT EXISTS idx_patients_manager_management 
ON public.patients(assigned_manager, management_status);

-- daily_patient_status 성능 개선
CREATE INDEX IF NOT EXISTS idx_daily_status_date 
ON public.daily_patient_status(status_date);

CREATE INDEX IF NOT EXISTS idx_daily_status_type 
ON public.daily_patient_status(status_type);

-- 2. admin 역할에 모든 환자 조회 권한 추가
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;

CREATE POLICY "Admins can view all patients" 
ON public.patients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.approval_status = 'approved'
  )
);

-- 3. daily_patient_status에도 admin 권한 추가
DROP POLICY IF EXISTS "Admins can view all daily status" ON public.daily_patient_status;

CREATE POLICY "Admins can view all daily status" 
ON public.daily_patient_status 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.approval_status = 'approved'
  )
);

-- 4. 다른 테이블들에도 admin 권한 추가
-- admission_cycles
DROP POLICY IF EXISTS "Admins can view all admission cycles" ON public.admission_cycles;

CREATE POLICY "Admins can view all admission cycles" 
ON public.admission_cycles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.approval_status = 'approved'
  )
);

-- medical_info
DROP POLICY IF EXISTS "Admins can view all medical info" ON public.medical_info;

CREATE POLICY "Admins can view all medical info" 
ON public.medical_info 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.approval_status = 'approved'
  )
);

-- packages
DROP POLICY IF EXISTS "Admins can view all packages" ON public.packages;

CREATE POLICY "Admins can view all packages" 
ON public.packages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.approval_status = 'approved'
  )
);

-- patient_notes
DROP POLICY IF EXISTS "Admins can view all patient notes" ON public.patient_notes;

CREATE POLICY "Admins can view all patient notes" 
ON public.patient_notes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.approval_status = 'approved'
  )
);

-- treatment_history
DROP POLICY IF EXISTS "Admins can view all treatment history" ON public.treatment_history;

CREATE POLICY "Admins can view all treatment history" 
ON public.treatment_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.approval_status = 'approved'
  )
);

-- treatment_plans
DROP POLICY IF EXISTS "Admins can view all treatment plans" ON public.treatment_plans;

CREATE POLICY "Admins can view all treatment plans" 
ON public.treatment_plans 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.approval_status = 'approved'
  )
);