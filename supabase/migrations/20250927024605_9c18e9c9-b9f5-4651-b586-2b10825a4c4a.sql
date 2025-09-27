-- 모든 기존 정책 삭제 및 재생성

-- user_roles 테이블의 모든 정책 삭제
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can manage all roles" ON public.user_roles;

-- 단순하고 안전한 RLS 정책으로 재생성
-- 1. 사용자는 자신의 역할만 볼 수 있음
CREATE POLICY "view_own_roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. 회원가입 시에만 역할 생성 가능
CREATE POLICY "insert_own_roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. 마스터 권한 확인 함수 (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_master_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role = 'master'
    AND approval_status = 'approved'
  );
$$;

-- 4. 마스터는 모든 역할 관리 가능
CREATE POLICY "master_full_access" 
ON public.user_roles 
FOR ALL 
USING (public.check_master_access(auth.uid()))
WITH CHECK (public.check_master_access(auth.uid()));

-- torogrr@kakao.com 계정에 즉시 마스터 권한 부여
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