-- Drop all existing policies for INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Managers can delete package transactions for their patients" ON public.package_transactions;
DROP POLICY IF EXISTS "Managers can delete transactions for assigned patients" ON public.package_transactions;
DROP POLICY IF EXISTS "Managers can insert package transactions for their patients" ON public.package_transactions;
DROP POLICY IF EXISTS "Managers can insert transactions for assigned patients" ON public.package_transactions;
DROP POLICY IF EXISTS "Managers can update package transactions for their patients" ON public.package_transactions;
DROP POLICY IF EXISTS "Managers can update transactions for assigned patients" ON public.package_transactions;
DROP POLICY IF EXISTS "Masters can insert all package transactions" ON public.package_transactions;
DROP POLICY IF EXISTS "Masters can insert any transactions" ON public.package_transactions;

-- Create clean new policies
-- INSERT: Allow managers for their patients, masters for all
CREATE POLICY "insert_manager_own_patients"
ON public.package_transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = package_transactions.patient_id
    AND patients.assigned_manager = auth.uid()
  )
);

CREATE POLICY "insert_master_all"
ON public.package_transactions
FOR INSERT
WITH CHECK (
  public.is_master_user(auth.uid())
);

-- UPDATE: Managers can only update their own patients' transactions
CREATE POLICY "update_manager_own_patients"
ON public.package_transactions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = package_transactions.patient_id
    AND patients.assigned_manager = auth.uid()
  )
);

-- DELETE: Managers can only delete their own patients' transactions
CREATE POLICY "delete_manager_own_patients"
ON public.package_transactions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = package_transactions.patient_id
    AND patients.assigned_manager = auth.uid()
  )
);