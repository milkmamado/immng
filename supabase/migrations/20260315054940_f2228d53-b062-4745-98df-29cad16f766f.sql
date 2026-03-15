-- 환자 테이블 주요 검색/필터 컬럼 인덱스
CREATE INDEX IF NOT EXISTS idx_patients_assigned_manager ON public.patients (assigned_manager);
CREATE INDEX IF NOT EXISTS idx_patients_branch ON public.patients (branch);
CREATE INDEX IF NOT EXISTS idx_patients_management_status ON public.patients (management_status);
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON public.patients (patient_number);
CREATE INDEX IF NOT EXISTS idx_patients_branch_manager ON public.patients (branch, assigned_manager);

-- 일일현황 테이블 (가장 빨리 커지는 테이블)
CREATE INDEX IF NOT EXISTS idx_daily_status_patient_date ON public.daily_patient_status (patient_id, status_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_status_date ON public.daily_patient_status (status_date);
CREATE INDEX IF NOT EXISTS idx_daily_status_branch ON public.daily_patient_status (branch);

-- 입퇴원 사이클
CREATE INDEX IF NOT EXISTS idx_admission_cycles_patient ON public.admission_cycles (patient_id);
CREATE INDEX IF NOT EXISTS idx_admission_cycles_branch ON public.admission_cycles (branch);

-- 패키지 거래
CREATE INDEX IF NOT EXISTS idx_package_transactions_patient ON public.package_transactions (patient_id);
CREATE INDEX IF NOT EXISTS idx_package_transactions_date ON public.package_transactions (transaction_date);

-- 치료 이력
CREATE INDEX IF NOT EXISTS idx_treatment_history_patient ON public.treatment_history (patient_id);

-- 환자 노트
CREATE INDEX IF NOT EXISTS idx_patient_notes_patient ON public.patient_notes (patient_id);

-- 패키지
CREATE INDEX IF NOT EXISTS idx_packages_patient ON public.packages (patient_id);

-- 돌환 추적
CREATE INDEX IF NOT EXISTS idx_reconnect_tracking_patient ON public.patient_reconnect_tracking (patient_id);