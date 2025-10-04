-- Add admin view policy for patient_reconnect_tracking table
CREATE POLICY "Admins can view all reconnect tracking"
ON public.patient_reconnect_tracking
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND ur.approval_status = 'approved'
  )
);