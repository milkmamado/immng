-- Add patient_or_guardian column to patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS patient_or_guardian TEXT DEFAULT '환자';