-- 진단명 옵션 테이블
CREATE TABLE public.diagnosis_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 이전병원 옵션 테이블
CREATE TABLE public.hospital_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 실비보험유형 옵션 테이블
CREATE TABLE public.insurance_type_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 치료상세 옵션 테이블
CREATE TABLE public.treatment_detail_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS 활성화
ALTER TABLE public.diagnosis_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_type_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_detail_options ENABLE ROW LEVEL SECURITY;

-- 모든 승인된 사용자는 조회 가능
CREATE POLICY "Anyone can view diagnosis options"
ON public.diagnosis_options FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can view hospital options"
ON public.hospital_options FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can view insurance type options"
ON public.insurance_type_options FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can view treatment detail options"
ON public.treatment_detail_options FOR SELECT
TO authenticated
USING (true);

-- 마스터만 추가/수정/삭제 가능
CREATE POLICY "Only master can manage diagnosis options"
ON public.diagnosis_options FOR ALL
TO authenticated
USING (is_master_user(auth.uid()))
WITH CHECK (is_master_user(auth.uid()));

CREATE POLICY "Only master can manage hospital options"
ON public.hospital_options FOR ALL
TO authenticated
USING (is_master_user(auth.uid()))
WITH CHECK (is_master_user(auth.uid()));

CREATE POLICY "Only master can manage insurance type options"
ON public.insurance_type_options FOR ALL
TO authenticated
USING (is_master_user(auth.uid()))
WITH CHECK (is_master_user(auth.uid()));

CREATE POLICY "Only master can manage treatment detail options"
ON public.treatment_detail_options FOR ALL
TO authenticated
USING (is_master_user(auth.uid()))
WITH CHECK (is_master_user(auth.uid()));

-- 예시 데이터 삽입
INSERT INTO public.diagnosis_options (name) VALUES
  ('폐암'),
  ('위암'),
  ('대장암'),
  ('간암'),
  ('유방암'),
  ('갑상선암'),
  ('췌장암'),
  ('담낭암'),
  ('신장암'),
  ('방광암');

INSERT INTO public.hospital_options (name) VALUES
  ('서울대병원'),
  ('삼성서울병원'),
  ('아산병원'),
  ('세브란스병원'),
  ('서울성모병원'),
  ('강남세브란스병원'),
  ('분당서울대병원'),
  ('고대안암병원'),
  ('고대구로병원'),
  ('경희대병원');

INSERT INTO public.insurance_type_options (name) VALUES
  ('실비보험'),
  ('암보험'),
  ('종합보험'),
  ('건강보험'),
  ('무보험'),
  ('실비+암보험'),
  ('기타');

INSERT INTO public.treatment_detail_options (name) VALUES
  ('고주파온열암치료'),
  ('싸이모신알파1'),
  ('미슬토주사'),
  ('셀레늄주사'),
  ('고농도비타민C'),
  ('면역증강주사'),
  ('해독재생치료'),
  ('항암부작용관리'),
  ('통증관리'),
  ('영양수액치료');