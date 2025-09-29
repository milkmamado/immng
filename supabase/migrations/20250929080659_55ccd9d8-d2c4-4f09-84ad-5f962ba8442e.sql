-- 기존 환자 데이터의 counselor 필드를 "환자" 또는 "보호자"로 업데이트
UPDATE patients 
SET counselor = CASE 
  WHEN counselor LIKE '%상담%' THEN '보호자'
  ELSE '환자'
END 
WHERE counselor IS NOT NULL AND counselor != '';

-- counselor 필드가 비어있거나 null인 경우 '환자'로 설정
UPDATE patients 
SET counselor = '환자' 
WHERE counselor IS NULL OR counselor = '';