-- 담당실장 3명을 id 기반으로 랜덤하게 배정
UPDATE patients 
SET manager_name = CASE 
  WHEN hashtext(id::text) % 3 = 0 THEN '김실장'
  WHEN hashtext(id::text) % 3 = 1 THEN '박실장'
  ELSE '이실장'
END;

-- 환자 or 보호자를 patient_number 기반으로 랜덤하게 배정 (약 60% 환자, 40% 보호자)
UPDATE patients 
SET counselor = CASE 
  WHEN hashtext(patient_number) % 5 IN (0, 1, 2) THEN '환자'
  ELSE '보호자'
END;