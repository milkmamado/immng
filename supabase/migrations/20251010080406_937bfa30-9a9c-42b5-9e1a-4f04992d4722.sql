-- Remove unused columns from patients table
ALTER TABLE public.patients
DROP COLUMN IF EXISTS referral_source,
DROP COLUMN IF EXISTS memo1,
DROP COLUMN IF EXISTS memo2;