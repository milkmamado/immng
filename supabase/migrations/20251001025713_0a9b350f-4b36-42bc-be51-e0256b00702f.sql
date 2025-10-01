-- Add birth_date column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS birth_date date;