-- Admin도 모든 profiles를 볼 수 있도록 정책 추가
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));