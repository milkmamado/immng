-- Excel 시트 기반 환자 관리 테이블 재구성

-- 기본 환자 테이블에 새 컬럼 추가 (시트1 + 시트2 통합)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS inflow_status text DEFAULT '유입',
ADD COLUMN IF NOT EXISTS visit_motivation text,
ADD COLUMN IF NOT EXISTS detailed_diagnosis text,
ADD COLUMN IF NOT EXISTS counselor text,
ADD COLUMN IF NOT EXISTS previous_hospital text,
ADD COLUMN IF NOT EXISTS diet_info text,
ADD COLUMN IF NOT EXISTS korean_doctor text,
ADD COLUMN IF NOT EXISTS western_doctor text,
ADD COLUMN IF NOT EXISTS counseling_content text,
ADD COLUMN IF NOT EXISTS chart_number text,
ADD COLUMN IF NOT EXISTS insurance_type text,
ADD COLUMN IF NOT EXISTS hospital_treatment text,
ADD COLUMN IF NOT EXISTS examination_schedule text,
ADD COLUMN IF NOT EXISTS treatment_plan text,
ADD COLUMN IF NOT EXISTS monthly_avg_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_visit_date date,
ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS manager_name text;

-- 일별 환자 상태 추적 테이블 생성 (시트3 기반)
CREATE TABLE IF NOT EXISTS daily_patient_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  status_date date NOT NULL,
  status_type text NOT NULL CHECK (status_type IN ('입원', '퇴원', '재원', '낮병동', '외래', '기타', '전화F/U')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  UNIQUE(patient_id, status_date, status_type)
);

-- RLS 정책 설정
ALTER TABLE daily_patient_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view daily status for their patients"
ON daily_patient_status FOR SELECT
USING (EXISTS (
  SELECT 1 FROM patients 
  WHERE patients.id = daily_patient_status.patient_id 
  AND (patients.assigned_manager = auth.uid() OR has_role(auth.uid(), 'master'::user_role))
));

CREATE POLICY "Managers can manage daily status for their patients"
ON daily_patient_status FOR ALL
USING (EXISTS (
  SELECT 1 FROM patients 
  WHERE patients.id = daily_patient_status.patient_id 
  AND patients.assigned_manager = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM patients 
  WHERE patients.id = daily_patient_status.patient_id 
  AND patients.assigned_manager = auth.uid()
));

-- 업데이트 트리거 추가
CREATE TRIGGER update_daily_patient_status_updated_at
  BEFORE UPDATE ON daily_patient_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기존 뷰 삭제 후 재생성
DROP VIEW IF EXISTS patient_summary;
CREATE VIEW patient_summary AS
SELECT 
  p.id,
  p.patient_number,
  p.name,
  p.age,
  p.gender,
  p.phone,
  p.assigned_manager,
  p.inflow_status,
  p.visit_type,
  p.detailed_diagnosis,
  p.manager_name,
  p.payment_amount,
  p.last_visit_date,
  p.created_at,
  p.updated_at
FROM patients p;