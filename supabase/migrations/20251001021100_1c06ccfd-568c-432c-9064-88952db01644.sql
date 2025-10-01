-- Create patient_status_options table for managing status options
CREATE TABLE IF NOT EXISTS public.patient_status_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  exclude_from_daily_tracking BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.patient_status_options ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view patient status options"
  ON public.patient_status_options
  FOR SELECT
  USING (true);

CREATE POLICY "Only master can manage patient status options"
  ON public.patient_status_options
  FOR ALL
  USING (is_master_user(auth.uid()))
  WITH CHECK (is_master_user(auth.uid()));

-- Insert default status options
INSERT INTO public.patient_status_options (name, exclude_from_daily_tracking) VALUES
  ('관리 중', false),
  ('치료종료', true),
  ('상태악화', true),
  ('사망', true);

-- Add management_status column to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS management_status TEXT DEFAULT '관리 중';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_management_status ON public.patients(management_status);