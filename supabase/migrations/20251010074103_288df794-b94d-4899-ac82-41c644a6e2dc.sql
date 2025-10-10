
-- 1. patient_summary 뷰 삭제
DROP VIEW IF EXISTS patient_summary;

-- 2. patient_number, birth_date 컬럼 삭제
ALTER TABLE patients DROP COLUMN IF EXISTS patient_number;
ALTER TABLE patients DROP COLUMN IF EXISTS birth_date;

-- 3. patient_summary 뷰 재생성 (patient_number 제외)
CREATE OR REPLACE VIEW patient_summary AS
SELECT 
  p.id,
  p.name,
  p.phone,
  p.age,
  p.gender,
  p.visit_type,
  p.inflow_status,
  p.last_visit_date,
  p.payment_amount,
  p.assigned_manager,
  p.diagnosis_category,
  p.diagnosis_detail,
  p.created_at,
  p.updated_at,
  pr.name as manager_name,
  pr.email as manager_email
FROM patients p
LEFT JOIN profiles pr ON p.assigned_manager = pr.id;
