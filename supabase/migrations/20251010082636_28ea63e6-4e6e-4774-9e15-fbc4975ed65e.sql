-- 이전병원 대분류 및 중분류 추가

-- 대분류 병원 추가
INSERT INTO hospital_options (name, parent_id) VALUES
('고대병원', NULL),
('경희대병원', NULL),
('가천대병원', NULL),
('백병원', NULL),
('삼성병원', NULL),
('서울대병원', NULL),
('성모병원', NULL),
('성심병원', NULL),
('세브란스병원', NULL),
('순천향대병원', NULL),
('아산병원', NULL),
('이대병원', NULL),
('을지대병원', NULL),
('중대병원', NULL),
('차병원', NULL),
('한양대병원', NULL),
('기타', NULL)
ON CONFLICT (name, parent_id) DO NOTHING;

-- 고대병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '안암', id FROM hospital_options WHERE name = '고대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '구로', id FROM hospital_options WHERE name = '고대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '안산', id FROM hospital_options WHERE name = '고대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 경희대병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '서울(동대문)', id FROM hospital_options WHERE name = '경희대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '강동', id FROM hospital_options WHERE name = '경희대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 가천대병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '길병원', id FROM hospital_options WHERE name = '가천대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '동인천 길병원', id FROM hospital_options WHERE name = '가천대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 백병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '일산', id FROM hospital_options WHERE name = '백병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '상계', id FROM hospital_options WHERE name = '백병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '의정부', id FROM hospital_options WHERE name = '백병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '안중', id FROM hospital_options WHERE name = '백병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '수원', id FROM hospital_options WHERE name = '백병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '인천', id FROM hospital_options WHERE name = '백병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '남양주', id FROM hospital_options WHERE name = '백병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 삼성병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '강남(서울)', id FROM hospital_options WHERE name = '삼성병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '강북', id FROM hospital_options WHERE name = '삼성병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '분당', id FROM hospital_options WHERE name = '삼성병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 서울대병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '대학로', id FROM hospital_options WHERE name = '서울대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '분당', id FROM hospital_options WHERE name = '서울대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '보라매', id FROM hospital_options WHERE name = '서울대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 성모병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '반포', id FROM hospital_options WHERE name = '성모병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '대림', id FROM hospital_options WHERE name = '성모병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '명지', id FROM hospital_options WHERE name = '성모병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '인천', id FROM hospital_options WHERE name = '성모병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '부천', id FROM hospital_options WHERE name = '성모병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '여의도', id FROM hospital_options WHERE name = '성모병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '은평', id FROM hospital_options WHERE name = '성모병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '의정부', id FROM hospital_options WHERE name = '성모병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 성심병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '강동', id FROM hospital_options WHERE name = '성심병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '구로', id FROM hospital_options WHERE name = '성심병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '한강', id FROM hospital_options WHERE name = '성심병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '강남', id FROM hospital_options WHERE name = '성심병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 세브란스병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '신촌', id FROM hospital_options WHERE name = '세브란스병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '강남', id FROM hospital_options WHERE name = '세브란스병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 순천향대병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '서울(용산)', id FROM hospital_options WHERE name = '순천향대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '부천', id FROM hospital_options WHERE name = '순천향대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '천안', id FROM hospital_options WHERE name = '순천향대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 아산병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '서울(송파)', id FROM hospital_options WHERE name = '아산병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '금강(용산)', id FROM hospital_options WHERE name = '아산병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 이대병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '목동', id FROM hospital_options WHERE name = '이대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '서울(강서구)', id FROM hospital_options WHERE name = '이대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 을지대병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '강남', id FROM hospital_options WHERE name = '을지대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '노원', id FROM hospital_options WHERE name = '을지대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 중대병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '흑석', id FROM hospital_options WHERE name = '중대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '광명', id FROM hospital_options WHERE name = '중대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '의정부', id FROM hospital_options WHERE name = '중대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 차병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '강남', id FROM hospital_options WHERE name = '차병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '분당', id FROM hospital_options WHERE name = '차병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 한양대병원 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '서울(성동구)', id FROM hospital_options WHERE name = '한양대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '구리', id FROM hospital_options WHERE name = '한양대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '일산', id FROM hospital_options WHERE name = '한양대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '광명', id FROM hospital_options WHERE name = '한양대병원' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;

-- 기타 중분류
INSERT INTO hospital_options (name, parent_id)
SELECT '국립암센터', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '건대병원', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '아주대병원', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '광명성애명원', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '부천세종병원', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '동국대병원', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '원자력병원', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '홍익병원', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '양지병원', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT 'CM병원', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;
INSERT INTO hospital_options (name, parent_id)
SELECT '기타', id FROM hospital_options WHERE name = '기타' AND parent_id IS NULL
ON CONFLICT (name, parent_id) DO NOTHING;