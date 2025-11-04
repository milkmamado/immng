-- Add consultation_date column to patients table
ALTER TABLE public.patients 
ADD COLUMN consultation_date date;