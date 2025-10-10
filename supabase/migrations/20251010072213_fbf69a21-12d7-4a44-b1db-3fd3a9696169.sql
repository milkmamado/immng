-- patients 테이블 컬럼 변경
ALTER TABLE public.patients 
  RENAME COLUMN diagnosis TO diagnosis_category;

ALTER TABLE public.patients 
  RENAME COLUMN detailed_diagnosis TO diagnosis_detail;

ALTER TABLE public.patients 
  RENAME COLUMN previous_hospital TO hospital_category;

-- 병원 중분류 컬럼 추가
ALTER TABLE public.patients 
  ADD COLUMN hospital_branch TEXT;

-- diagnosis_options 테이블에 parent_id 추가 (대분류/중분류 구분)
ALTER TABLE public.diagnosis_options 
  ADD COLUMN parent_id UUID REFERENCES public.diagnosis_options(id);

-- hospital_options 테이블에 parent_id 추가 (대분류/중분류 구분)
ALTER TABLE public.hospital_options 
  ADD COLUMN parent_id UUID REFERENCES public.hospital_options(id);

-- 인덱스 추가 (성능 향상)
CREATE INDEX idx_diagnosis_options_parent_id ON public.diagnosis_options(parent_id);
CREATE INDEX idx_hospital_options_parent_id ON public.hospital_options(parent_id);