-- 모든 환자 관련 데이터 삭제
-- 순서: 참조 테이블들을 먼저 삭제한 후 patients 테이블 삭제

-- 1. 재연결 추적 데이터 삭제
DELETE FROM public.patient_reconnect_tracking;

-- 2. 치료 계획 데이터 삭제
DELETE FROM public.treatment_plans;

-- 3. 치료 이력 데이터 삭제
DELETE FROM public.treatment_history;

-- 4. 일별 환자 상태 데이터 삭제
DELETE FROM public.daily_patient_status;

-- 5. 환자 노트 삭제
DELETE FROM public.patient_notes;

-- 6. 패키지 정보 삭제
DELETE FROM public.packages;

-- 7. 의료 정보 삭제
DELETE FROM public.medical_info;

-- 8. 입원 사이클 정보 삭제
DELETE FROM public.admission_cycles;

-- 9. 마지막으로 환자 데이터 삭제
DELETE FROM public.patients;