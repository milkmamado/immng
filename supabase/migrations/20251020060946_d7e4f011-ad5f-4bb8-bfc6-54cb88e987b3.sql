-- Add special note and treatment memo columns to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS special_note_1 TEXT,
ADD COLUMN IF NOT EXISTS special_note_2 TEXT,
ADD COLUMN IF NOT EXISTS treatment_memo_1 TEXT,
ADD COLUMN IF NOT EXISTS treatment_memo_2 TEXT;