-- torogrr@kakao.com 계정에 마스터 권한 직접 부여
INSERT INTO public.user_roles (user_id, role, approval_status, approved_at, approved_by)
VALUES (
  '7185c408-5b7b-48f2-ad7b-d94d9e79e2cf',
  'master'::user_role,
  'approved'::approval_status,
  now(),
  '7185c408-5b7b-48f2-ad7b-d94d9e79e2cf'
)
ON CONFLICT (user_id, role) 
DO UPDATE SET 
  approval_status = 'approved',
  approved_at = now(),
  approved_by = '7185c408-5b7b-48f2-ad7b-d94d9e79e2cf';