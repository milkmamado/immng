-- 승인 기반 회원가입 시스템 구현 (수정버전)

-- 승인 상태 enum 생성 (존재하지 않을 경우에만)
DO $$ BEGIN
    CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- user_roles 테이블에 승인 상태 컬럼 추가 (이미 존재하지 않을 경우에만)
DO $$ BEGIN
    ALTER TABLE public.user_roles 
    ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'pending';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.user_roles 
    ADD COLUMN approved_at timestamp with time zone;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.user_roles 
    ADD COLUMN approved_by uuid REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 기존 역할들을 승인됨으로 설정
UPDATE public.user_roles 
SET approval_status = 'approved', approved_at = now()
WHERE approval_status IS NULL OR approval_status = 'pending';

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

-- 승인된 사용자만 접근할 수 있도록 하는 함수
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