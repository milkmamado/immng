-- 역할 타입 정의
CREATE TYPE public.user_role AS ENUM ('master', 'manager');

-- 사용자 프로필 테이블
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 사용자 역할 테이블 (보안상 분리)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'manager',
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 환자 기본 정보 테이블
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_number TEXT NOT NULL UNIQUE, -- 환자 고유번호
  name TEXT NOT NULL,
  resident_number_masked TEXT, -- 주민등록번호 (뒷자리 마스킹)
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  phone TEXT,
  emergency_contact TEXT,
  address TEXT,
  guardian_name TEXT,
  guardian_relationship TEXT,
  guardian_phone TEXT,
  
  -- 담당 매니저 (매니저만 본인 환자 볼 수 있도록)
  assigned_manager UUID NOT NULL REFERENCES auth.users(id),
  
  -- 내원 정보
  first_visit_date DATE,
  referral_source TEXT, -- 내원 경로
  visit_type TEXT, -- 외래, 단기입원, 장기입원
  admission_date DATE,
  discharge_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 암 관련 의료 정보 테이블
CREATE TABLE public.medical_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  
  -- 암 기본 정보
  cancer_type TEXT NOT NULL, -- 암 종류
  cancer_stage TEXT, -- 병기 (1기, 2기, 3기, 4기)
  diagnosis_date DATE,
  primary_doctor TEXT, -- 주치의 (대학병원)
  metastasis_status BOOLEAN DEFAULT FALSE,
  metastasis_sites TEXT[], -- 전이 부위
  biopsy_result TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 치료 이력 테이블
CREATE TABLE public.treatment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  
  treatment_type TEXT NOT NULL, -- 수술, 항암, 방사선, 기타
  treatment_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  hospital_name TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 패키지 및 결제 정보 테이블
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  
  package_type TEXT NOT NULL, -- 패키지 유형
  package_amount DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  included_treatments TEXT[],
  
  -- 보험 정보
  insurance_type TEXT, -- 직장, 지역, 의료급여
  insurance_limit DECIMAL(12,2),
  insurance_used DECIMAL(12,2) DEFAULT 0,
  has_private_insurance BOOLEAN DEFAULT FALSE,
  
  -- 결제 정보
  total_cost DECIMAL(12,2) NOT NULL,
  insurance_coverage DECIMAL(12,2) DEFAULT 0,
  patient_payment DECIMAL(12,2) NOT NULL,
  payment_method TEXT,
  payment_date DATE,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- 역할 확인 함수 (보안상 중요)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 프로필 RLS 정책
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Masters can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'master'));

-- 역할 RLS 정책
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Masters can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Masters can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'master'));

-- 환자 RLS 정책 (핵심!)
CREATE POLICY "Managers can view their assigned patients" ON public.patients
  FOR SELECT USING (auth.uid() = assigned_manager);

CREATE POLICY "Managers can update their assigned patients" ON public.patients
  FOR UPDATE USING (auth.uid() = assigned_manager);

CREATE POLICY "Managers can insert patients as their assigned" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() = assigned_manager);

CREATE POLICY "Masters can view all patients" ON public.patients
  FOR SELECT USING (public.has_role(auth.uid(), 'master'));

-- 의료 정보 RLS 정책
CREATE POLICY "Access medical info through patient assignment" ON public.medical_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = medical_info.patient_id 
      AND (patients.assigned_manager = auth.uid() OR public.has_role(auth.uid(), 'master'))
    )
  );

CREATE POLICY "Managers can manage medical info for their patients" ON public.medical_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = medical_info.patient_id 
      AND patients.assigned_manager = auth.uid()
    )
  );

-- 치료 이력 RLS 정책
CREATE POLICY "Access treatment history through patient assignment" ON public.treatment_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = treatment_history.patient_id 
      AND (patients.assigned_manager = auth.uid() OR public.has_role(auth.uid(), 'master'))
    )
  );

CREATE POLICY "Managers can manage treatment history for their patients" ON public.treatment_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = treatment_history.patient_id 
      AND patients.assigned_manager = auth.uid()
    )
  );

-- 패키지 정보 RLS 정책
CREATE POLICY "Access packages through patient assignment" ON public.packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = packages.patient_id 
      AND (patients.assigned_manager = auth.uid() OR public.has_role(auth.uid(), 'master'))
    )
  );

CREATE POLICY "Managers can manage packages for their patients" ON public.packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = packages.patient_id 
      AND patients.assigned_manager = auth.uid()
    )
  );

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 생성
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_info_updated_at
  BEFORE UPDATE ON public.medical_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();