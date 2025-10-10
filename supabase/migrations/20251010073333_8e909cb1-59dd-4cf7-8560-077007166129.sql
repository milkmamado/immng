
-- API 시뮬레이션을 위한 테스트 데이터 생성 (gender 수정)

-- 1. 유방암 중분류 옵션 추가
INSERT INTO diagnosis_options (name, parent_id, created_by)
VALUES 
  ('침윤성 유방암', (SELECT id FROM diagnosis_options WHERE name = '유방암' AND parent_id IS NULL LIMIT 1), 'f23d664a-7bd0-4c8c-a06e-186dd18ab048'),
  ('0기 유방암', (SELECT id FROM diagnosis_options WHERE name = '유방암' AND parent_id IS NULL LIMIT 1), 'f23d664a-7bd0-4c8c-a06e-186dd18ab048'),
  ('삼중음성 유방암', (SELECT id FROM diagnosis_options WHERE name = '유방암' AND parent_id IS NULL LIMIT 1), 'f23d664a-7bd0-4c8c-a06e-186dd18ab048')
ON CONFLICT DO NOTHING;

-- 2. 삼성서울병원 중분류 옵션 추가
INSERT INTO hospital_options (name, parent_id, created_by)
VALUES 
  ('강남', (SELECT id FROM hospital_options WHERE name = '삼성서울병원' AND parent_id IS NULL LIMIT 1), 'f23d664a-7bd0-4c8c-a06e-186dd18ab048'),
  ('일원', (SELECT id FROM hospital_options WHERE name = '삼성서울병원' AND parent_id IS NULL LIMIT 1), 'f23d664a-7bd0-4c8c-a06e-186dd18ab048')
ON CONFLICT DO NOTHING;

-- 3. API 시뮬레이션 테스트 환자 데이터 생성
INSERT INTO patients (
  patient_number,
  name,
  customer_number,
  resident_number_masked,
  phone,
  gender,
  age,
  visit_motivation,
  diagnosis_category,
  diagnosis_detail,
  hospital_category,
  hospital_branch,
  address,
  crm_memo,
  assigned_manager,
  inflow_status,
  visit_type,
  first_visit_date,
  manager_name
)
SELECT
  generate_patient_number(),
  '김영희',
  'C-2025-001',
  '850315-2******',
  '010-1234-5678',
  '여성',
  45,
  '유방암 진단 후 한방치료 상담 목적으로 내원. 수술 후 항암치료 중이며 부작용 관리 및 면역력 강화 필요.',
  '유방암',
  '침윤성 유방암',
  '삼성서울병원',
  '강남',
  '14922 / 경기도 시흥시 은계중앙로 123',
  '삼성병원에서 수술 후 항암치료 중. 면역력 증진 및 항암 부작용 관리 위해 내원 희망. 가족력 있음(어머니 유방암). 현재 2차 항암 진행 중.',
  'f23d664a-7bd0-4c8c-a06e-186dd18ab048',
  '유입',
  '외래',
  CURRENT_DATE,
  '권은솔'
WHERE NOT EXISTS (
  SELECT 1 FROM patients WHERE customer_number = 'C-2025-001'
);
