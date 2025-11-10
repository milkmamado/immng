-- admin 역할도 모든 user_roles를 볼 수 있도록 RLS 정책 추가
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'::user_role
    AND ur.approval_status = 'approved'::approval_status
  )
);