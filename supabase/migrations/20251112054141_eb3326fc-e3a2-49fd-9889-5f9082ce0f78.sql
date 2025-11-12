-- Add INSERT policy for admin users
CREATE POLICY "insert_admin_all"
ON public.package_transactions
FOR INSERT
WITH CHECK (
  public.is_admin_user(auth.uid())
);