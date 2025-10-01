-- 재원 상태 모두 삭제
DELETE FROM public.daily_patient_status
WHERE status_type = '재원';