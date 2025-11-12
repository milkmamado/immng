-- patient_number의 unique constraint도 지점별로 변경
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_patient_number_key;

-- 지점별 patient_number unique constraint 생성
CREATE UNIQUE INDEX IF NOT EXISTS patients_patient_number_branch_unique 
ON patients (patient_number, branch) 
WHERE patient_number IS NOT NULL;