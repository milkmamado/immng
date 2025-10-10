-- Rename columns in patients table
ALTER TABLE public.patients 
RENAME COLUMN chart_number TO customer_number;

ALTER TABLE public.patients 
RENAME COLUMN counseling_content TO crm_memo;