-- Add unique constraint to customer_number in patients table
-- This prevents duplicate customer numbers at database level
ALTER TABLE public.patients 
ADD CONSTRAINT patients_customer_number_key UNIQUE (customer_number);