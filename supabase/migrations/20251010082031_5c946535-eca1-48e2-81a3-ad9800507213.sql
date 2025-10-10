-- 진단명 대분류 및 중분류 설정
-- 기존 데이터 삭제 후 새로운 구조로 재구성

-- 임시로 기존 데이터 백업 (필요시)
-- DELETE FROM diagnosis_options;

-- 대분류 삽입 (parent_id가 NULL인 항목들)
INSERT INTO diagnosis_options (name, parent_id) VALUES
('암', NULL),
('대상포진', NULL),
('안면마비', NULL),
('람세이헌트', NULL),
('부인과수술후회복', NULL),
('교통사고', NULL),
('척추관절', NULL),
('자반증', NULL),
('줄기세포', NULL),
('통합면역', NULL)
ON CONFLICT DO NOTHING;

-- 암 중분류
INSERT INTO diagnosis_options (name, parent_id)
SELECT '유방암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '자궁(경부)암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '난소암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '갑상선암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '대장암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '위암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '간암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '담도암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '췌장암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '폐암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '전립선암', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '뇌종양', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '기타암(두경부, 육종암, 흑색종, 구강, 척수 등)', id FROM diagnosis_options WHERE name = '암' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 대상포진 중분류
INSERT INTO diagnosis_options (name, parent_id)
SELECT '초기 경증', id FROM diagnosis_options WHERE name = '대상포진' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '초기 중증', id FROM diagnosis_options WHERE name = '대상포진' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '후유증', id FROM diagnosis_options WHERE name = '대상포진' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 안면마비 중분류
INSERT INTO diagnosis_options (name, parent_id)
SELECT '급성기(초기)', id FROM diagnosis_options WHERE name = '안면마비' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '아급성기(중기)', id FROM diagnosis_options WHERE name = '안면마비' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '만성기(후기)', id FROM diagnosis_options WHERE name = '안면마비' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 람세이헌트 중분류
INSERT INTO diagnosis_options (name, parent_id)
SELECT '급성기', id FROM diagnosis_options WHERE name = '람세이헌트' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '아급성기', id FROM diagnosis_options WHERE name = '람세이헌트' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '만성기', id FROM diagnosis_options WHERE name = '람세이헌트' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 척추관절 중분류
INSERT INTO diagnosis_options (name, parent_id)
SELECT '수술후재활', id FROM diagnosis_options WHERE name = '척추관절' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '통증', id FROM diagnosis_options WHERE name = '척추관절' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 자반증 중분류
INSERT INTO diagnosis_options (name, parent_id)
SELECT '알레르기성 자반증(헤노흐-쉔라인)', id FROM diagnosis_options WHERE name = '자반증' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '혈소판감소성 자반증', id FROM diagnosis_options WHERE name = '자반증' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '단순 자반증(노인성/외상성)', id FROM diagnosis_options WHERE name = '자반증' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 줄기세포 중분류
INSERT INTO diagnosis_options (name, parent_id)
SELECT '수액', id FROM diagnosis_options WHERE name = '줄기세포' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '피부', id FROM diagnosis_options WHERE name = '줄기세포' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '흉터', id FROM diagnosis_options WHERE name = '줄기세포' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 통합면역 중분류
INSERT INTO diagnosis_options (name, parent_id)
SELECT '내과질환', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '위장병', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '수액', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '감기', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '뇌혈관질환', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO diagnosis_options (name, parent_id)
SELECT '접종', id FROM diagnosis_options WHERE name = '통합면역' AND parent_id IS NULL
ON CONFLICT DO NOTHING;