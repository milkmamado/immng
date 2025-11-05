-- 지점(branch) enum 타입 생성
CREATE TYPE public.branch_type AS ENUM ('강서', '광명', '성동');

-- user_roles 테이블에 branch 컬럼 추가
ALTER TABLE public.user_roles 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- profiles 테이블에 branch 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- patients 테이블에 branch 컬럼 추가
ALTER TABLE public.patients 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- admission_cycles 테이블에 branch 컬럼 추가
ALTER TABLE public.admission_cycles 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- daily_patient_status 테이블에 branch 컬럼 추가
ALTER TABLE public.daily_patient_status 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- medical_info 테이블에 branch 컬럼 추가
ALTER TABLE public.medical_info 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- packages 테이블에 branch 컬럼 추가
ALTER TABLE public.packages 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- package_management 테이블에 branch 컬럼 추가
ALTER TABLE public.package_management 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- package_transactions 테이블에 branch 컬럼 추가
ALTER TABLE public.package_transactions 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- patient_notes 테이블에 branch 컬럼 추가
ALTER TABLE public.patient_notes 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- patient_reconnect_tracking 테이블에 branch 컬럼 추가
ALTER TABLE public.patient_reconnect_tracking 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- treatment_history 테이블에 branch 컬럼 추가
ALTER TABLE public.treatment_history 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- treatment_plans 테이블에 branch 컬럼 추가
ALTER TABLE public.treatment_plans 
ADD COLUMN branch branch_type NOT NULL DEFAULT '광명';

-- RLS 정책 업데이트: patients 테이블
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Managers can view their assigned patients" ON public.patients;
DROP POLICY IF EXISTS "Managers can insert patients as their assigned" ON public.patients;
DROP POLICY IF EXISTS "Managers can update their assigned patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can view patients based on supervisor relationships" ON public.patients;

-- 새로운 정책 생성 (같은 지점만 조회 가능)
CREATE POLICY "Managers can view their assigned patients in same branch"
ON public.patients
FOR SELECT
TO authenticated
USING (
  auth.uid() = assigned_manager 
  AND branch = (
    SELECT branch FROM public.user_roles 
    WHERE user_id = auth.uid() AND approval_status = 'approved'
    LIMIT 1
  )
);

CREATE POLICY "Managers can insert patients in same branch"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = assigned_manager 
  AND branch = (
    SELECT branch FROM public.user_roles 
    WHERE user_id = auth.uid() AND approval_status = 'approved'
    LIMIT 1
  )
);

CREATE POLICY "Managers can update their patients in same branch"
ON public.patients
FOR UPDATE
TO authenticated
USING (
  auth.uid() = assigned_manager 
  AND branch = (
    SELECT branch FROM public.user_roles 
    WHERE user_id = auth.uid() AND approval_status = 'approved'
    LIMIT 1
  )
);

CREATE POLICY "Admins can view patients in same branch"
ON public.patients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.approval_status = 'approved'
    AND ur.branch = patients.branch
    AND (
      NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM manager_supervisors ms
        WHERE ms.supervisor_id = auth.uid() AND ms.manager_id = patients.assigned_manager
      )
    )
  )
);

-- Master는 모든 지점 접근 가능 (기존 정책 유지)
-- Masters can view all patients, Masters can manage all patients 정책은 그대로 유지

-- user_roles 정책 업데이트
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- profiles 정책 업데이트  
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);