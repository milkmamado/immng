-- Add non_covered_amount column to package_transactions table
ALTER TABLE public.package_transactions 
ADD COLUMN IF NOT EXISTS non_covered_amount numeric DEFAULT 0;