-- gender 제약조건을 한국어로 수정
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_gender_check;
ALTER TABLE public.patients ADD CONSTRAINT patients_gender_check CHECK (gender IN ('남성', '여성'));

-- 환자 삭제를 위한 RLS 정책 추가
CREATE POLICY "Managers can delete their assigned patients" ON public.patients
FOR DELETE USING ((auth.uid() = assigned_manager) AND is_user_approved(auth.uid()));

CREATE POLICY "Masters can delete any patient" ON public.patients
FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'master'
    AND ur.approval_status = 'approved'
  )
);