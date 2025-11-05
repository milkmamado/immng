-- 사용자가 회원가입 시 자신의 pending role을 생성할 수 있도록 허용
CREATE POLICY "Users can create their own pending role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND approval_status = 'pending'::approval_status
  AND role = 'manager'::user_role
);