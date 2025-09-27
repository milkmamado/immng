-- torogrr@kakao.com 자동 최고 관리자 설정 트리거

-- 프로필 생성 시 최고 관리자 계정 확인 함수
CREATE OR REPLACE FUNCTION public.handle_super_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- torogrr@kakao.com인 경우 자동으로 마스터 권한 부여
  IF NEW.email = 'torogrr@kakao.com' THEN
    -- 기존 역할이 있으면 승인 상태로 업데이트, 없으면 생성
    INSERT INTO public.user_roles (user_id, role, approval_status, approved_at, approved_by)
    VALUES (NEW.id, 'master'::user_role, 'approved'::approval_status, now(), NEW.id)
    ON CONFLICT (user_id, role) 
    DO UPDATE SET 
      approval_status = 'approved',
      approved_at = now(),
      approved_by = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- profiles 테이블에 트리거 설정
CREATE OR REPLACE TRIGGER on_super_admin_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_super_admin_signup();