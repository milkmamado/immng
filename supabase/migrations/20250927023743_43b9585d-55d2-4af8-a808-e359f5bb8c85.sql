-- 승인 기반 회원가입 시스템 구현

-- 승인 상태 enum 추가
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- user_roles 테이블에 승인 상태 컬럼 추가
ALTER TABLE public.user_roles 
ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'pending',
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approved_by uuid REFERENCES auth.users(id);

-- 기존 역할들을 승인됨으로 설정
UPDATE public.user_roles 
SET approval_status = 'approved', approved_at = now();

-- torogrr@kakao.com을 최고 관리자로 설정하는 함수
CREATE OR REPLACE FUNCTION public.setup_super_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- torogrr@kakao.com 계정이 있으면 마스터 권한 부여
  INSERT INTO public.user_roles (user_id, role, approval_status, approved_at, approved_by)
  SELECT 
    auth.users.id,
    'master'::user_role,
    'approved'::approval_status,
    now(),
    auth.users.id
  FROM auth.users 
  WHERE auth.users.email = 'torogrr@kakao.com'
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    approval_status = 'approved',
    approved_at = now();
END;
$$;

-- 승인된 사용자만 로그인할 수 있도록 하는 함수
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND approval_status = 'approved'
  );
$$;

-- RLS 정책 업데이트 - 승인된 사용자만 접근 가능
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id AND approval_status = 'approved');

-- 마스터는 모든 역할 관리 가능 (승인 상태 포함)
DROP POLICY IF EXISTS "Masters can manage roles" ON public.user_roles;
CREATE POLICY "Masters can manage roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'master' 
    AND ur.approval_status = 'approved'
  )
);

-- 환자 접근 정책도 승인된 사용자만 가능하도록 업데이트
DROP POLICY IF EXISTS "Managers can view their assigned patients" ON public.patients;
CREATE POLICY "Managers can view their assigned patients" 
ON public.patients 
FOR SELECT 
USING (
  auth.uid() = assigned_manager 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Managers can update their assigned patients" ON public.patients;
CREATE POLICY "Managers can update their assigned patients" 
ON public.patients 
FOR UPDATE 
USING (
  auth.uid() = assigned_manager 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Managers can insert patients as their assigned" ON public.patients;
CREATE POLICY "Managers can insert patients as their assigned" 
ON public.patients 
FOR INSERT 
WITH CHECK (
  auth.uid() = assigned_manager 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Masters can view all patients" ON public.patients;
CREATE POLICY "Masters can view all patients" 
ON public.patients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'master' 
    AND ur.approval_status = 'approved'
  )
);