-- 환자 삭제 시 관련 데이터 자동 삭제를 위한 외래키 제약조건 추가

-- treatment_plans 테이블에 외래키 제약조건 추가
ALTER TABLE public.treatment_plans
DROP CONSTRAINT IF EXISTS treatment_plans_patient_id_fkey,
ADD CONSTRAINT treatment_plans_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES public.patients(id) 
  ON DELETE CASCADE;

-- medical_info 테이블에 외래키 제약조건 추가
ALTER TABLE public.medical_info
DROP CONSTRAINT IF EXISTS medical_info_patient_id_fkey,
ADD CONSTRAINT medical_info_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES public.patients(id) 
  ON DELETE CASCADE;

-- packages 테이블에 외래키 제약조건 추가
ALTER TABLE public.packages
DROP CONSTRAINT IF EXISTS packages_patient_id_fkey,
ADD CONSTRAINT packages_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES public.patients(id) 
  ON DELETE CASCADE;

-- admission_cycles 테이블에 외래키 제약조건 추가
ALTER TABLE public.admission_cycles
DROP CONSTRAINT IF EXISTS admission_cycles_patient_id_fkey,
ADD CONSTRAINT admission_cycles_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES public.patients(id) 
  ON DELETE CASCADE;

-- daily_patient_status 테이블에 외래키 제약조건 추가
ALTER TABLE public.daily_patient_status
DROP CONSTRAINT IF EXISTS daily_patient_status_patient_id_fkey,
ADD CONSTRAINT daily_patient_status_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES public.patients(id) 
  ON DELETE CASCADE;

-- patient_notes 테이블에 외래키 제약조건 추가
ALTER TABLE public.patient_notes
DROP CONSTRAINT IF EXISTS patient_notes_patient_id_fkey,
ADD CONSTRAINT patient_notes_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES public.patients(id) 
  ON DELETE CASCADE;

-- treatment_history 테이블에 외래키 제약조건 추가
ALTER TABLE public.treatment_history
DROP CONSTRAINT IF EXISTS treatment_history_patient_id_fkey,
ADD CONSTRAINT treatment_history_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES public.patients(id) 
  ON DELETE CASCADE;

-- patient_reconnect_tracking 테이블에 외래키 제약조건 추가
ALTER TABLE public.patient_reconnect_tracking
DROP CONSTRAINT IF EXISTS patient_reconnect_tracking_patient_id_fkey,
ADD CONSTRAINT patient_reconnect_tracking_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES public.patients(id) 
  ON DELETE CASCADE;