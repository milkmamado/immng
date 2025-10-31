-- diagnosis_options 테이블에 sort_order 컬럼 추가
ALTER TABLE diagnosis_options ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- 진단명 대분류 정렬 순서 업데이트
UPDATE diagnosis_options SET sort_order = 1 WHERE name = '암' AND parent_id IS NULL;
UPDATE diagnosis_options SET sort_order = 2 WHERE name = '대상포진' AND parent_id IS NULL;
UPDATE diagnosis_options SET sort_order = 3 WHERE name = '안면마비' AND parent_id IS NULL;
UPDATE diagnosis_options SET sort_order = 4 WHERE name = '람세이헌트' AND parent_id IS NULL;
UPDATE diagnosis_options SET sort_order = 5 WHERE name = '부인과 수술 후 회복' AND parent_id IS NULL;
UPDATE diagnosis_options SET sort_order = 6 WHERE name = '교통사고' AND parent_id IS NULL;
UPDATE diagnosis_options SET sort_order = 7 WHERE name = '척추질환' AND parent_id IS NULL;
UPDATE diagnosis_options SET sort_order = 8 WHERE name = '자반증' AND parent_id IS NULL;
UPDATE diagnosis_options SET sort_order = 9 WHERE name = '줄기세포' AND parent_id IS NULL;
UPDATE diagnosis_options SET sort_order = 10 WHERE name = '통합면역' AND parent_id IS NULL;