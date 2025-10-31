-- Add failure_reason column to patients table
ALTER TABLE public.patients 
ADD COLUMN failure_reason text;