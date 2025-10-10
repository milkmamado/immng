-- 김영희 환자 정보 업데이트
UPDATE patients
SET 
  diagnosis_category = '암',
  diagnosis_detail = '유방암',
  hospital_category = '삼성병원',
  hospital_branch = '강북',
  updated_at = now()
WHERE name = '김영희' OR customer_number = 'C-2025-001';