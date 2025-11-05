-- user_roles 테이블의 unique constraint 수정
-- 한 사용자가 지점별로 role을 가질 수 있도록 변경

-- 새로운 unique constraint 추가: (user_id, branch) 조합
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_branch_key UNIQUE (user_id, branch);

-- has_role 함수 업데이트: branch 파라미터 추가
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role, _branch branch_type DEFAULT NULL)
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
      AND role = _role
      AND approval_status = 'approved'
      AND (_branch IS NULL OR branch = _branch)
  )
$$;