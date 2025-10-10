
-- 1. 기존 제약 조건 제거
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_gender_check;

-- 2. 기존 한글 데이터를 M, F로 변환
UPDATE patients 
SET gender = CASE 
  WHEN gender IN ('남성', 'M') THEN 'M'
  WHEN gender IN ('여성', 'F') THEN 'F'
  ELSE gender
END
WHERE gender IS NOT NULL;

-- 3. M, F만 허용하는 새로운 제약 조건 추가
ALTER TABLE patients ADD CONSTRAINT patients_gender_check 
CHECK (gender IS NULL OR gender IN ('M', 'F'));
