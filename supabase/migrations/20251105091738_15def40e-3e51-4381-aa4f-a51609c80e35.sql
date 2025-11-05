-- daily_patient_status 테이블에 Master가 모든 데이터를 관리할 수 있도록 정책 추가
CREATE POLICY "Masters can manage all daily status"
ON public.daily_patient_status
FOR ALL
TO public
USING (has_role(auth.uid(), 'master'::user_role))
WITH CHECK (has_role(auth.uid(), 'master'::user_role));