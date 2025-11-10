-- 무한 순환을 일으키는 정책 삭제
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- security definer 함수 생성 (admin 체크용)
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'admin'::user_role
    AND approval_status = 'approved'::approval_status
  )
$$;

-- 안전한 admin 정책 추가
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));