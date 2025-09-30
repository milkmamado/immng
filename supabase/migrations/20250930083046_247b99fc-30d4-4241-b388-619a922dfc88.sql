-- Add unique constraint for daily_patient_status
ALTER TABLE public.daily_patient_status
ADD CONSTRAINT daily_patient_status_patient_date_unique 
UNIQUE (patient_id, status_date);

-- Add memo columns to patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS memo1 TEXT,
ADD COLUMN IF NOT EXISTS memo2 TEXT;