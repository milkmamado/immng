-- Add display_order column to patients table for drag and drop ordering
ALTER TABLE public.patients 
ADD COLUMN display_order integer;

-- Create index for better performance when sorting by display_order
CREATE INDEX idx_patients_display_order ON public.patients(display_order);

-- Set initial display_order based on created_at (oldest first)
UPDATE public.patients 
SET display_order = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY assigned_manager ORDER BY created_at) as row_num
  FROM public.patients
) sub
WHERE public.patients.id = sub.id;