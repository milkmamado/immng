-- torogrr@kakao.com에 직접 마스터 권한 부여

-- 기존 계정에 마스터 권한 부여
INSERT INTO public.user_roles (user_id, role, approval_status, approved_at, approved_by)
SELECT 
  p.id,
  'master'::user_role,
  'approved'::approval_status,
  now(),
  p.id
FROM public.profiles p
WHERE p.email = 'torogrr@kakao.com'
ON CONFLICT (user_id, role) 
DO UPDATE SET 
  approval_status = 'approved',
  approved_at = now(),
  approved_by = EXCLUDED.approved_by;

-- 혹시 profiles에 없다면 auth.users에서 직접 찾아서 추가
INSERT INTO public.user_roles (user_id, role, approval_status, approved_at, approved_by)
SELECT 
  au.id,
  'master'::user_role,
  'approved'::approval_status,
  now(),
  au.id
FROM auth.users au
WHERE au.email = 'torogrr@kakao.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = au.id AND ur.role = 'master'
  );