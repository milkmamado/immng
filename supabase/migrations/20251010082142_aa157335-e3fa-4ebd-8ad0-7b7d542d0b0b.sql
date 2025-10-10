-- 삼성서울병원과 강북 지점 추가
INSERT INTO hospital_options (name, parent_id) VALUES
('삼성서울병원', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO hospital_options (name, parent_id)
SELECT '강북', id FROM hospital_options WHERE name = '삼성서울병원' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 김영희 환자 정보 업데이트
UPDATE patients
SET 
  diagnosis_category = '암',
  diagnosis_detail = '유방암',
  hospital_category = '삼성서울병원',
  hospital_branch = '강북',
  updated_at = now()
WHERE customer_number = 'C-2025-001';