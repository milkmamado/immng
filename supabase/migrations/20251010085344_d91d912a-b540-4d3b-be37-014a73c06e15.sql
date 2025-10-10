-- 김영희와 이철수에게 주민번호 추가
UPDATE patients 
SET resident_number_masked = '751215-2******'
WHERE name = '김영희';

UPDATE patients 
SET resident_number_masked = '730522-1******'
WHERE name = '이철수';