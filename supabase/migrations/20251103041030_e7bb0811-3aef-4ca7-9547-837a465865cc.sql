-- Create manager_supervisors table to track which supervisors can view which managers' patients
CREATE TABLE public.manager_supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(supervisor_id, manager_id)
);

-- Enable RLS
ALTER TABLE public.manager_supervisors ENABLE ROW LEVEL SECURITY;

-- Only masters can manage supervisor-manager relationships
CREATE POLICY "Masters can manage supervisor-manager relationships"
ON public.manager_supervisors
FOR ALL
USING (is_master_user(auth.uid()))
WITH CHECK (is_master_user(auth.uid()));

-- Supervisors can view their managed managers
CREATE POLICY "Supervisors can view their managed managers"
ON public.manager_supervisors
FOR SELECT
USING (auth.uid() = supervisor_id);

-- Insert relationships for naseyiyam@gmail.com to supervise the two managers
INSERT INTO public.manager_supervisors (supervisor_id, manager_id, created_by)
SELECT 
  u1.id as supervisor_id,
  u2.id as manager_id,
  u1.id as created_by
FROM auth.users u1
CROSS JOIN auth.users u2
WHERE u1.email = 'naseyiyam@gmail.com'
  AND u2.email IN ('notgul8778@gmail.com', 'rocband79@gmail.com');

-- Update patients RLS policy for admins to check supervisor relationships
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;

CREATE POLICY "Admins can view patients based on supervisor relationships"
ON public.patients
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND (
      -- If admin has supervisor relationships, only show those managers' patients
      NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
      OR
      -- Or if they do have relationships, only show patients from supervised managers
      EXISTS (
        SELECT 1 
        FROM manager_supervisors ms 
        WHERE ms.supervisor_id = auth.uid() 
        AND ms.manager_id = patients.assigned_manager
      )
    )
  )
);

-- Update other related tables RLS policies for admins
DROP POLICY IF EXISTS "Admins can view all admission cycles" ON public.admission_cycles;
CREATE POLICY "Admins can view admission cycles based on supervisor relationships"
ON public.admission_cycles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = admission_cycles.patient_id
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = p.assigned_manager
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can view all daily status" ON public.daily_patient_status;
CREATE POLICY "Admins can view daily status based on supervisor relationships"
ON public.daily_patient_status
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = daily_patient_status.patient_id
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = p.assigned_manager
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can view all medical info" ON public.medical_info;
CREATE POLICY "Admins can view medical info based on supervisor relationships"
ON public.medical_info
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = medical_info.patient_id
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = p.assigned_manager
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can view all package management" ON public.package_management;
CREATE POLICY "Admins can view package management based on supervisor relationships"
ON public.package_management
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = package_management.patient_id
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = p.assigned_manager
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can view all package transactions" ON public.package_transactions;
CREATE POLICY "Admins can view package transactions based on supervisor relationships"
ON public.package_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = package_transactions.patient_id
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = p.assigned_manager
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can view all packages" ON public.packages;
CREATE POLICY "Admins can view packages based on supervisor relationships"
ON public.packages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = packages.patient_id
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = p.assigned_manager
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can view all patient notes" ON public.patient_notes;
CREATE POLICY "Admins can view patient notes based on supervisor relationships"
ON public.patient_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_notes.patient_id
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = p.assigned_manager
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can view all reconnect tracking" ON public.patient_reconnect_tracking;
CREATE POLICY "Admins can view reconnect tracking based on supervisor relationships"
ON public.patient_reconnect_tracking
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_reconnect_tracking.patient_id
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = p.assigned_manager
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can view all treatment history" ON public.treatment_history;
CREATE POLICY "Admins can view treatment history based on supervisor relationships"
ON public.treatment_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = treatment_history.patient_id
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = p.assigned_manager
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can view all treatment plans" ON public.treatment_plans;
CREATE POLICY "Admins can view treatment plans based on supervisor relationships"
ON public.treatment_plans
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role 
    AND ur.approval_status = 'approved'::approval_status
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = treatment_plans.patient_id
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = p.assigned_manager
        )
      )
    )
  )
);