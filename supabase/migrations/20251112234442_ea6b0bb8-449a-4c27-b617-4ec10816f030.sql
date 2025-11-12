-- 기존 customer_number unique constraint 제거 (있다면)
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_customer_number_key;

-- 지점별 고객번호 unique constraint 생성
-- 같은 지점 내에서만 고객번호가 unique하도록 설정
CREATE UNIQUE INDEX IF NOT EXISTS patients_customer_number_branch_unique 
ON patients (customer_number, branch) 
WHERE customer_number IS NOT NULL;