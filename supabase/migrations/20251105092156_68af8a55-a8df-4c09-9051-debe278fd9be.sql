-- user_roles 테이블에 approved_at 컬럼 추가
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

-- 마스터가 모든 테이블을 관리할 수 있도록 RLS 정책 추가
CREATE POLICY "Masters can manage all patients"
ON public.patients
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));

CREATE POLICY "Masters can manage all admission cycles"
ON public.admission_cycles
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));

CREATE POLICY "Masters can manage all medical info"
ON public.medical_info
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));

CREATE POLICY "Masters can manage all packages"
ON public.packages
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));

CREATE POLICY "Masters can manage all package management"
ON public.package_management
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));

CREATE POLICY "Masters can manage all package transactions"
ON public.package_transactions
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));

CREATE POLICY "Masters can manage all treatment history"
ON public.treatment_history
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));

CREATE POLICY "Masters can manage all treatment plans"
ON public.treatment_plans
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));

CREATE POLICY "Masters can manage all patient notes"
ON public.patient_notes
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));

CREATE POLICY "Masters can manage all patient reconnect tracking"
ON public.patient_reconnect_tracking
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));