-- Add missing columns to patients table for CRM integration
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS customer_number TEXT,
ADD COLUMN IF NOT EXISTS diagnosis_detail TEXT,
ADD COLUMN IF NOT EXISTS hospital_category TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for customer_number
CREATE INDEX IF NOT EXISTS idx_patients_customer_number ON public.patients(customer_number);