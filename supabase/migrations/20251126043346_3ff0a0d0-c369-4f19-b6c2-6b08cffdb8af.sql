-- Admin과 Master가 입원/외래 매출 관리를 위해 patients의 payment_amount를 업데이트할 수 있도록 허용
CREATE POLICY "Admins and Masters can update payment_amount for revenue management"
ON public.patients
FOR UPDATE
TO authenticated
USING (
  public.is_admin_user(auth.uid()) OR 
  public.is_master_user(auth.uid())
)
WITH CHECK (
  public.is_admin_user(auth.uid()) OR 
  public.is_master_user(auth.uid())
);