-- Update visit_motivation for the test patient
UPDATE public.patients
SET visit_motivation = '블로그'
WHERE customer_number = 'C-2025-001';