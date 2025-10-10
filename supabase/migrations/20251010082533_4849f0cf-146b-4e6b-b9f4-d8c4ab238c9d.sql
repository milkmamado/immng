-- hospital_options의 unique 제약조건 수정
-- 기존 name unique 제약조건 삭제
ALTER TABLE hospital_options DROP CONSTRAINT IF EXISTS hospital_options_name_key;

-- parent_id와 name의 조합으로 unique 제약조건 추가
-- 같은 병원 내에서는 중복된 지점명이 없지만, 다른 병원에서는 같은 지점명 사용 가능
ALTER TABLE hospital_options ADD CONSTRAINT hospital_options_parent_name_unique UNIQUE (parent_id, name);