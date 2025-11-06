-- daily_patient_status의 status_type에 "돌환" 추가
ALTER TABLE public.daily_patient_status 
DROP CONSTRAINT IF EXISTS daily_patient_status_status_type_check;

ALTER TABLE public.daily_patient_status 
ADD CONSTRAINT daily_patient_status_status_type_check 
CHECK (status_type = ANY (ARRAY['입원'::text, '퇴원'::text, '재원'::text, '낮병동'::text, '외래'::text, '기타'::text, '전화F/U'::text, '돌환'::text]));