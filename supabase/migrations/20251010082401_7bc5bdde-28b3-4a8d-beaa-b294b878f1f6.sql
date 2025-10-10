-- hospital_options의 unique 제약 조건 수정
-- name 단독 unique 제약 제거하고, (name, parent_id) 복합 unique 제약 추가

-- 기존 unique 제약 제거
ALTER TABLE hospital_options DROP CONSTRAINT IF EXISTS hospital_options_name_key;

-- name과 parent_id 복합 unique 제약 추가 (같은 부모 아래에서만 고유)
ALTER TABLE hospital_options ADD CONSTRAINT hospital_options_name_parent_key UNIQUE (name, parent_id);