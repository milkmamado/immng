-- Drop all existing INSERT, UPDATE, DELETE policies
DROP POLICY IF EXISTS "Managers can manage package transactions for their patients" ON public.package_transactions;
DROP POLICY IF EXISTS "Managers can insert package transactions for their patients" ON public.package_transactions;
DROP POLICY IF EXISTS "Managers can update package transactions for their patients" ON public.package_transactions;
DROP POLICY IF EXISTS "Managers can delete package transactions for their patients" ON public.package_transactions;
DROP POLICY IF EXISTS "Masters can insert all package transactions" ON public.package_transactions;

-- Create new INSERT policies
CREATE POLICY "Managers can insert transactions for assigned patients"
ON public.package_transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = package_transactions.patient_id
    AND patients.assigned_manager = auth.uid()
  )
);

CREATE POLICY "Masters can insert any transactions"
ON public.package_transactions
FOR INSERT
WITH CHECK (
  public.is_master_user(auth.uid())
);

-- Create UPDATE and DELETE policies for managers
CREATE POLICY "Managers can update transactions for assigned patients"
ON public.package_transactions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = package_transactions.patient_id
    AND patients.assigned_manager = auth.uid()
  )
);

CREATE POLICY "Managers can delete transactions for assigned patients"
ON public.package_transactions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = package_transactions.patient_id
    AND patients.assigned_manager = auth.uid()
  )
);