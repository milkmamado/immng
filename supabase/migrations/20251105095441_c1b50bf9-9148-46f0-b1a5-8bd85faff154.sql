-- Drop the existing gender check constraint
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_gender_check;

-- Add new check constraint that allows both Korean and English gender values
ALTER TABLE patients ADD CONSTRAINT patients_gender_check 
CHECK (gender IN ('남', '여', 'M', 'F', 'm', 'f') OR gender IS NULL);