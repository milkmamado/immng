-- diagnosis_options 테이블의 unique constraint 수정
-- 기존 name만의 unique constraint 제거하고, parent_id와 name 조합으로 변경

-- 기존 unique constraint 제거
ALTER TABLE diagnosis_options DROP CONSTRAINT IF EXISTS diagnosis_options_name_key;

-- 새로운 unique constraint 추가 (parent_id, name 조합)
ALTER TABLE diagnosis_options ADD CONSTRAINT diagnosis_options_parent_name_key UNIQUE (parent_id, name);

-- 기존 데이터 삭제
DELETE FROM diagnosis_options;

-- 새로운 진단명 대분류 삽입
INSERT INTO diagnosis_options (name, parent_id) VALUES
  ('암', NULL),
  ('대상포진', NULL),
  ('안면마비', NULL),
  ('람세이헌트', NULL),
  ('부인과 수술 후 회복', NULL),
  ('교통사고', NULL),
  ('척추질환', NULL),
  ('자반증', NULL),
  ('줄기세포', NULL),
  ('통합면역', NULL);

-- 암 중분류
INSERT INTO diagnosis_options (name, parent_id) 
SELECT '유방암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '자궁(경부)암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '난소암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '갑상선암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '대장암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '위암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '간암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '담도암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '췌장암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '폐암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '전립선암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '뇌종양', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
UNION ALL
SELECT '기타암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL;

-- 대상포진 중분류
INSERT INTO diagnosis_options (name, parent_id) 
SELECT '초기 경증', id FROM diagnosis_options WHERE name = '대상포진' AND parent_id IS NULL
UNION ALL
SELECT '초기 중증', id FROM diagnosis_options WHERE name = '대상포진' AND parent_id IS NULL
UNION ALL
SELECT '후유증', id FROM diagnosis_options WHERE name = '대상포진' AND parent_id IS NULL;

-- 안면마비 중분류
INSERT INTO diagnosis_options (name, parent_id) 
SELECT '급성기(초기)', id FROM diagnosis_options WHERE name = '안면마비' AND parent_id IS NULL
UNION ALL
SELECT '아급성기(중기)', id FROM diagnosis_options WHERE name = '안면마비' AND parent_id IS NULL
UNION ALL
SELECT '만성기(후기)', id FROM diagnosis_options WHERE name = '안면마비' AND parent_id IS NULL;

-- 람세이헌트 중분류
INSERT INTO diagnosis_options (name, parent_id) 
SELECT '급성기', id FROM diagnosis_options WHERE name = '람세이헌트' AND parent_id IS NULL
UNION ALL
SELECT '아급성기', id FROM diagnosis_options WHERE name = '람세이헌트' AND parent_id IS NULL
UNION ALL
SELECT '만성기', id FROM diagnosis_options WHERE name = '람세이헌트' AND parent_id IS NULL;

-- 부인과 수술 후 회복 중분류
INSERT INTO diagnosis_options (name, parent_id) 
SELECT '수술 후 회복 관리', id FROM diagnosis_options WHERE name = '부인과 수술 후 회복' AND parent_id IS NULL;

-- 교통사고 중분류
INSERT INTO diagnosis_options (name, parent_id) 
SELECT '교통사고 입원', id FROM diagnosis_options WHERE name = '교통사고' AND parent_id IS NULL;

-- 척추질환 중분류
INSERT INTO diagnosis_options (name, parent_id) 
SELECT '수술후재활', id FROM diagnosis_options WHERE name = '척추질환' AND parent_id IS NULL
UNION ALL
SELECT '통증', id FROM diagnosis_options WHERE name = '척추질환' AND parent_id IS NULL;

-- 자반증 중분류
INSERT INTO diagnosis_options (name, parent_id) 
SELECT '알레르기성 자반증', id FROM diagnosis_options WHERE name = '자반증' AND parent_id IS NULL
UNION ALL
SELECT '혈소판감소성 자반증', id FROM diagnosis_options WHERE name = '자반증' AND parent_id IS NULL
UNION ALL
SELECT '단순 자반증', id FROM diagnosis_options WHERE name = '자반증' AND parent_id IS NULL;

-- 줄기세포 중분류
INSERT INTO diagnosis_options (name, parent_id) 
SELECT '수액', id FROM diagnosis_options WHERE name = '줄기세포' AND parent_id IS NULL
UNION ALL
SELECT '피부', id FROM diagnosis_options WHERE name = '줄기세포' AND parent_id IS NULL
UNION ALL
SELECT '흉터', id FROM diagnosis_options WHERE name = '줄기세포' AND parent_id IS NULL;

-- 통합면역 중분류
INSERT INTO diagnosis_options (name, parent_id) 
SELECT '내과질환', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
UNION ALL
SELECT '위장병', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
UNION ALL
SELECT '수액', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
UNION ALL
SELECT '감기', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
UNION ALL
SELECT '뇌혈관질환', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
UNION ALL
SELECT '접종', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL;