-- Update counselor field to 박민숙 for all patients assigned to qkralstnr@naver.com
UPDATE public.patients
SET counselor = '박민숙'
WHERE assigned_manager = '862b4fa8-2cd7-4470-a4dc-af70ada520c3';