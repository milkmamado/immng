-- Create treatment_plans table for managing multiple treatment plans per patient
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  treatment_detail TEXT NOT NULL,
  treatment_amount NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for treatment plans
CREATE POLICY "Access treatment plans through patient assignment" 
ON public.treatment_plans 
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM patients
  WHERE patients.id = treatment_plans.patient_id 
  AND (patients.assigned_manager = auth.uid() OR has_role(auth.uid(), 'master'::user_role))
));

CREATE POLICY "Managers can manage treatment plans for their patients" 
ON public.treatment_plans 
FOR ALL 
USING (EXISTS (
  SELECT 1
  FROM patients
  WHERE patients.id = treatment_plans.patient_id 
  AND patients.assigned_manager = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_treatment_plans_updated_at
BEFORE UPDATE ON public.treatment_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_treatment_plans_patient_id ON public.treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_is_paid ON public.treatment_plans(is_paid);