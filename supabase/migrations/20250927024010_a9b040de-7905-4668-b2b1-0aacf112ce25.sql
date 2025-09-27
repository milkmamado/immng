-- 보안 문제 해결

-- 함수의 search_path 설정 수정
CREATE OR REPLACE FUNCTION public.setup_super_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
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
    AND approval_status = 'approved'
  );
$$;