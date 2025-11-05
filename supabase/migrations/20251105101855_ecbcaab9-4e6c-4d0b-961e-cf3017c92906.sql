-- ============================================
-- 누락된 컬럼 및 제약조건 일괄 추가
-- ============================================

-- 1. PATIENTS 테이블 - 누락된 컬럼 추가
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS patient_or_guardian TEXT DEFAULT '환자'::text,
ADD COLUMN IF NOT EXISTS inflow_date DATE,
ADD COLUMN IF NOT EXISTS consultation_date DATE,
ADD COLUMN IF NOT EXISTS diagnosis_category TEXT,
ADD COLUMN IF NOT EXISTS hospital_branch TEXT,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS memo1 TEXT,
ADD COLUMN IF NOT EXISTS treatment_memo_1 TEXT,
ADD COLUMN IF NOT EXISTS treatment_memo_2 TEXT,
ADD COLUMN IF NOT EXISTS special_note_1 TEXT,
ADD COLUMN IF NOT EXISTS special_note_2 TEXT,
ADD COLUMN IF NOT EXISTS crm_memo TEXT;

-- 2. DAILY_PATIENT_STATUS 테이블 - unique constraints 추가
ALTER TABLE public.daily_patient_status 
DROP CONSTRAINT IF EXISTS daily_patient_status_patient_date_unique;

ALTER TABLE public.daily_patient_status 
ADD CONSTRAINT daily_patient_status_patient_date_unique 
UNIQUE (patient_id, status_date);

ALTER TABLE public.daily_patient_status
DROP CONSTRAINT IF EXISTS daily_patient_status_patient_id_status_date_status_type_key;

ALTER TABLE public.daily_patient_status
ADD CONSTRAINT daily_patient_status_patient_id_status_date_status_type_key 
UNIQUE (patient_id, status_date, status_type);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_daily_status_date ON public.daily_patient_status(status_date);
CREATE INDEX IF NOT EXISTS idx_daily_status_type ON public.daily_patient_status(status_type);

-- 3. PATIENT_NOTES 테이블 - 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_patient_notes_patient ON public.patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_type ON public.patient_notes(note_type);

-- 4. DIAGNOSIS_OPTIONS 테이블 - 컬럼 및 제약조건 추가
ALTER TABLE public.diagnosis_options
ADD COLUMN IF NOT EXISTS parent_id UUID,
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

ALTER TABLE public.diagnosis_options
DROP CONSTRAINT IF EXISTS diagnosis_options_parent_name_key;

ALTER TABLE public.diagnosis_options
ADD CONSTRAINT diagnosis_options_parent_name_key 
UNIQUE (parent_id, name);

CREATE INDEX IF NOT EXISTS idx_diagnosis_options_parent_id ON public.diagnosis_options(parent_id);

-- 5. HOSPITAL_OPTIONS 테이블 - 컬럼 및 제약조건 추가
ALTER TABLE public.hospital_options
ADD COLUMN IF NOT EXISTS parent_id UUID;

ALTER TABLE public.hospital_options
DROP CONSTRAINT IF EXISTS hospital_options_parent_name_unique;

ALTER TABLE public.hospital_options
DROP CONSTRAINT IF EXISTS hospital_options_name_parent_key;

ALTER TABLE public.hospital_options
ADD CONSTRAINT hospital_options_parent_name_unique 
UNIQUE (parent_id, name);

CREATE INDEX IF NOT EXISTS idx_hospital_options_parent_id ON public.hospital_options(parent_id);

-- 6. PACKAGE_TRANSACTIONS 테이블 - 컬럼 및 인덱스 추가
ALTER TABLE public.package_transactions
ADD COLUMN IF NOT EXISTS date_from DATE,
ADD COLUMN IF NOT EXISTS date_to DATE;

CREATE INDEX IF NOT EXISTS idx_package_transactions_patient ON public.package_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_package_transactions_date ON public.package_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_package_transactions_type ON public.package_transactions(transaction_type);

-- 7. PACKAGE_MANAGEMENT 테이블 - 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_package_management_patient_id ON public.package_management(patient_id);
CREATE INDEX IF NOT EXISTS idx_package_management_last_synced ON public.package_management(last_synced_at);

-- 8. ADMISSION_CYCLES 테이블 - unique constraint 추가
ALTER TABLE public.admission_cycles
DROP CONSTRAINT IF EXISTS admission_cycles_patient_id_cycle_number_key;

ALTER TABLE public.admission_cycles
ADD CONSTRAINT admission_cycles_patient_id_cycle_number_key 
UNIQUE (patient_id, cycle_number);

-- 9. PATIENTS 테이블 - 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_patients_assigned_manager ON public.patients(assigned_manager);
CREATE INDEX IF NOT EXISTS idx_patients_customer_number ON public.patients(customer_number);
CREATE INDEX IF NOT EXISTS idx_patients_first_visit ON public.patients(first_visit_date);
CREATE INDEX IF NOT EXISTS idx_patients_inflow_status ON public.patients(inflow_status);
CREATE INDEX IF NOT EXISTS idx_patients_management_status ON public.patients(management_status);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);

-- 10. PACKAGES 테이블 - 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_packages_patient ON public.packages(patient_id);

-- 11. TREATMENT_PLANS 테이블 - 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON public.treatment_plans(patient_id);

-- 12. TREATMENT_HISTORY 테이블 - 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_treatment_history_patient ON public.treatment_history(patient_id);

-- 13. PATIENT_RECONNECT_TRACKING 테이블 - 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_patient_reconnect_tracking_patient ON public.patient_reconnect_tracking(patient_id);