-- Add diagnosis field to patients table
ALTER TABLE public.patients ADD COLUMN diagnosis text;

-- Update existing data: move detailed_diagnosis to diagnosis for consistency
UPDATE public.patients 
SET diagnosis = detailed_diagnosis 
WHERE detailed_diagnosis IS NOT NULL AND diagnosis IS NULL;