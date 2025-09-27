-- 무한 재귀 문제 해결을 위한 RLS 정책 수정

-- 기존 문제가 되는 정책들 삭제
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can manage roles" ON public.user_roles;

-- 단순한 RLS 정책으로 재생성 (무한재귀 방지)
-- 사용자는 자신의 역할만 볼 수 있음 (승인 상태 무관)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 사용자는 자신의 역할을 업데이트할 수 없음 (관리자만 가능)
CREATE POLICY "Users cannot update roles" 
ON public.user_roles 
FOR UPDATE 
USING (false);

-- 사용자는 자신의 역할을 삭제할 수 없음
CREATE POLICY "Users cannot delete roles" 
ON public.user_roles 
FOR DELETE 
USING (false);

-- 일반 사용자는 역할을 생성할 수 있음 (회원가입용)
CREATE POLICY "Users can insert their own roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 특별한 함수로 마스터 권한 확인 (SECURITY DEFINER 사용)
CREATE OR REPLACE FUNCTION public.is_master_user(_user_id uuid)
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

-- 마스터 사용자는 모든 역할을 관리할 수 있음
CREATE POLICY "Masters can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_master_user(auth.uid()))
WITH CHECK (public.is_master_user(auth.uid()));