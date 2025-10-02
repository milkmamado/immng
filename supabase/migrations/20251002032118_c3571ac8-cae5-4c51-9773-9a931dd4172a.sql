
-- daily_patient_status 테이블의 status_type check constraint 제거
-- 이제 patient_status_options 테이블의 모든 값을 사용할 수 있도록 함
ALTER TABLE public.daily_patient_status 
DROP CONSTRAINT IF EXISTS daily_patient_status_status_type_check;
