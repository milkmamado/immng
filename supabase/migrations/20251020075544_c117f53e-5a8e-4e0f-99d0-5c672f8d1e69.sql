-- 기존 insurance_type_options 데이터 삭제
DELETE FROM insurance_type_options;

-- 새로운 실비보험유형 옵션 삽입
INSERT INTO insurance_type_options (name) VALUES
  ('무보험'),
  ('1세대'),
  ('2세대'),
  ('3세대'),
  ('4세대');