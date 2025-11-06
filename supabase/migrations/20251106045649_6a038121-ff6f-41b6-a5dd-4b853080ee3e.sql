-- Managers가 자신의 환자를 삭제할 수 있도록 DELETE 정책 추가
CREATE POLICY "Managers can delete their patients in same branch"
ON patients
FOR DELETE
TO authenticated
USING (
  auth.uid() = assigned_manager 
  AND branch = (
    SELECT branch FROM user_roles 
    WHERE user_id = auth.uid() 
    AND approval_status = 'approved'
    LIMIT 1
  )
);

-- 관련 테이블들에도 DELETE 정책 추가 (필요한 경우)
-- admission_cycles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admission_cycles' 
    AND policyname = 'Managers can delete admission cycles for their patients'
  ) THEN
    CREATE POLICY "Managers can delete admission cycles for their patients"
    ON admission_cycles
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = admission_cycles.patient_id
        AND patients.assigned_manager = auth.uid()
      )
    );
  END IF;
END $$;

-- daily_patient_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_patient_status' 
    AND policyname = 'Managers can delete daily status for their patients'
  ) THEN
    CREATE POLICY "Managers can delete daily status for their patients"
    ON daily_patient_status
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = daily_patient_status.patient_id
        AND patients.assigned_manager = auth.uid()
      )
    );
  END IF;
END $$;

-- medical_info
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medical_info' 
    AND policyname = 'Managers can delete medical info for their patients'
  ) THEN
    CREATE POLICY "Managers can delete medical info for their patients"
    ON medical_info
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = medical_info.patient_id
        AND patients.assigned_manager = auth.uid()
      )
    );
  END IF;
END $$;

-- packages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'packages' 
    AND policyname = 'Managers can delete packages for their patients'
  ) THEN
    CREATE POLICY "Managers can delete packages for their patients"
    ON packages
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = packages.patient_id
        AND patients.assigned_manager = auth.uid()
      )
    );
  END IF;
END $$;

-- patient_notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patient_notes' 
    AND policyname = 'Managers can delete notes for their patients'
  ) THEN
    CREATE POLICY "Managers can delete notes for their patients"
    ON patient_notes
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = patient_notes.patient_id
        AND patients.assigned_manager = auth.uid()
      )
    );
  END IF;
END $$;

-- treatment_history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'treatment_history' 
    AND policyname = 'Managers can delete treatment history for their patients'
  ) THEN
    CREATE POLICY "Managers can delete treatment history for their patients"
    ON treatment_history
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = treatment_history.patient_id
        AND patients.assigned_manager = auth.uid()
      )
    );
  END IF;
END $$;

-- treatment_plans
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'treatment_plans' 
    AND policyname = 'Managers can delete treatment plans for their patients'
  ) THEN
    CREATE POLICY "Managers can delete treatment plans for their patients"
    ON treatment_plans
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = treatment_plans.patient_id
        AND patients.assigned_manager = auth.uid()
      )
    );
  END IF;
END $$;

-- package_management
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'package_management' 
    AND policyname = 'Managers can delete package management for their patients'
  ) THEN
    CREATE POLICY "Managers can delete package management for their patients"
    ON package_management
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = package_management.patient_id
        AND patients.assigned_manager = auth.uid()
      )
    );
  END IF;
END $$;

-- package_transactions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'package_transactions' 
    AND policyname = 'Managers can delete package transactions for their patients'
  ) THEN
    CREATE POLICY "Managers can delete package transactions for their patients"
    ON package_transactions
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = package_transactions.patient_id
        AND patients.assigned_manager = auth.uid()
      )
    );
  END IF;
END $$;

-- patient_reconnect_tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patient_reconnect_tracking' 
    AND policyname = 'Managers can delete reconnect tracking for their patients'
  ) THEN
    CREATE POLICY "Managers can delete reconnect tracking for their patients"
    ON patient_reconnect_tracking
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = patient_reconnect_tracking.patient_id
        AND patients.assigned_manager = auth.uid()
      )
    );
  END IF;
END $$;