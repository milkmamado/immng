-- 역할 타입 정의
CREATE TYPE public.user_role AS ENUM ('master', 'manager', 'admin');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

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
  approval_status approval_status NOT NULL DEFAULT 'pending',
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 환자 기본 정보 테이블
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  resident_number_masked TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  phone TEXT,
  emergency_contact TEXT,
  address TEXT,
  guardian_name TEXT,
  guardian_relationship TEXT,
  guardian_phone TEXT,
  assigned_manager UUID NOT NULL REFERENCES auth.users(id),
  first_visit_date DATE,
  referral_source TEXT,
  visit_type TEXT,
  admission_date DATE,
  discharge_date DATE,
  inflow_status TEXT DEFAULT '유입',
  visit_motivation TEXT,
  detailed_diagnosis TEXT,
  counselor TEXT,
  previous_hospital TEXT,
  diet_info TEXT,
  korean_doctor TEXT,
  western_doctor TEXT,
  counseling_content TEXT,
  chart_number TEXT,
  insurance_type TEXT,
  hospital_treatment TEXT,
  examination_schedule TEXT,
  treatment_plan TEXT,
  monthly_avg_days INTEGER DEFAULT 0,
  last_visit_date DATE,
  payment_amount NUMERIC DEFAULT 0,
  manager_name TEXT,
  management_status TEXT DEFAULT '관리 중',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 암 관련 의료 정보 테이블
CREATE TABLE public.medical_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  cancer_type TEXT NOT NULL,
  cancer_stage TEXT,
  diagnosis_date DATE,
  primary_doctor TEXT,
  metastasis_status BOOLEAN DEFAULT FALSE,
  metastasis_sites TEXT[],
  biopsy_result TEXT,
  admission_cycle_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 치료 이력 테이블
CREATE TABLE public.treatment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_type TEXT NOT NULL,
  treatment_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  hospital_name TEXT,
  notes TEXT,
  admission_cycle_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 패키지 및 결제 정보 테이블
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL,
  package_amount DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  included_treatments TEXT[],
  insurance_type TEXT,
  insurance_limit DECIMAL(12,2),
  insurance_used DECIMAL(12,2) DEFAULT 0,
  has_private_insurance BOOLEAN DEFAULT FALSE,
  total_cost DECIMAL(12,2) NOT NULL,
  insurance_coverage DECIMAL(12,2) DEFAULT 0,
  patient_payment DECIMAL(12,2) NOT NULL,
  payment_method TEXT,
  payment_date DATE,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  admission_cycle_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 입퇴원 사이클 관리 테이블
CREATE TABLE public.admission_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  admission_date DATE NOT NULL,
  discharge_date DATE NULL,
  status TEXT NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted', 'discharged')),
  admission_type TEXT DEFAULT '입원',
  discharge_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, cycle_number)
);

-- 환자 메모/코멘트 테이블
CREATE TABLE public.patient_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  admission_cycle_id UUID NULL REFERENCES public.admission_cycles(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'medical', 'financial', 'family')),
  title TEXT,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 일별 환자 상태 추적 테이블
CREATE TABLE public.daily_patient_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  status_date DATE NOT NULL,
  status_type TEXT NOT NULL CHECK (status_type IN ('입원', '퇴원', '재원', '낮병동', '외래', '기타', '전화F/U')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(patient_id, status_date, status_type)
);

-- 치료 계획 테이블
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  treatment_detail TEXT NOT NULL,
  treatment_amount NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

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

-- 환자 상태 옵션 테이블
CREATE TABLE public.patient_status_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  exclude_from_daily_tracking BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- 이탈 리스크 환자 재연락 추적 테이블
CREATE TABLE public.patient_reconnect_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  is_reconnected BOOLEAN NOT NULL DEFAULT false,
  reconnect_notes TEXT,
  reconnected_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 패키지 관리 테이블
CREATE TABLE public.package_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  customer_number TEXT,
  deposit_total NUMERIC DEFAULT 0,
  deposit_used NUMERIC DEFAULT 0,
  deposit_balance NUMERIC DEFAULT 0,
  reward_total NUMERIC DEFAULT 0,
  reward_used NUMERIC DEFAULT 0,
  reward_balance NUMERIC DEFAULT 0,
  count_total INTEGER DEFAULT 0,
  count_used INTEGER DEFAULT 0,
  count_balance INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id)
);

-- 일자별 패키지 거래 내역 테이블
CREATE TABLE public.package_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  customer_number TEXT,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  count INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 담당자-관리자 관계 테이블
CREATE TABLE public.manager_supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(supervisor_id, manager_id)
);

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_patient_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_type_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_detail_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_status_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_reconnect_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_supervisors ENABLE ROW LEVEL SECURITY;

-- 역할 확인 헬퍼 함수들
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
    WHERE user_id = _user_id AND role = _role AND approval_status = 'approved'::approval_status
  )
$$;

CREATE OR REPLACE FUNCTION public.is_master_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'master'::user_role
    AND approval_status = 'approved'::approval_status
  )
$$;

-- 입원 기간 계산 함수
CREATE OR REPLACE FUNCTION public.calculate_stay_days(admission_date DATE, discharge_date DATE DEFAULT NULL)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN discharge_date IS NOT NULL THEN discharge_date - admission_date
    ELSE CURRENT_DATE - admission_date
  END;
$$;

-- 환자별 사이클 번호 자동 생성 함수
CREATE OR REPLACE FUNCTION public.get_next_cycle_number(patient_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(cycle_number), 0) + 1 
  FROM public.admission_cycles 
  WHERE patient_id = patient_uuid;
$$;

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_info_updated_at
  BEFORE UPDATE ON public.medical_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admission_cycles_updated_at
  BEFORE UPDATE ON public.admission_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_notes_updated_at
  BEFORE UPDATE ON public.patient_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_patient_status_updated_at
  BEFORE UPDATE ON public.daily_patient_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_reconnect_tracking_updated_at
  BEFORE UPDATE ON public.patient_reconnect_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_management_updated_at
  BEFORE UPDATE ON public.package_management
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_transactions_updated_at
  BEFORE UPDATE ON public.package_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS 정책들
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Masters can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Masters can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Masters can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Managers can view their assigned patients" ON public.patients
  FOR SELECT USING (auth.uid() = assigned_manager);

CREATE POLICY "Managers can update their assigned patients" ON public.patients
  FOR UPDATE USING (auth.uid() = assigned_manager);

CREATE POLICY "Managers can insert patients as their assigned" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() = assigned_manager);

CREATE POLICY "Masters can view all patients" ON public.patients
  FOR SELECT USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Admins can view patients based on supervisor relationships"
  ON public.patients FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND (
        NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM manager_supervisors ms 
          WHERE ms.supervisor_id = auth.uid() 
          AND ms.manager_id = patients.assigned_manager
        )
      )
    )
  );

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

CREATE POLICY "Admins can view medical info based on supervisor relationships" ON public.medical_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = medical_info.patient_id
        AND (
          NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM manager_supervisors ms 
            WHERE ms.supervisor_id = auth.uid() 
            AND ms.manager_id = p.assigned_manager
          )
        )
      )
    )
  );

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

CREATE POLICY "Admins can view treatment history based on supervisor relationships" ON public.treatment_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = treatment_history.patient_id
        AND (
          NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM manager_supervisors ms 
            WHERE ms.supervisor_id = auth.uid() 
            AND ms.manager_id = p.assigned_manager
          )
        )
      )
    )
  );

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

CREATE POLICY "Admins can view packages based on supervisor relationships" ON public.packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = packages.patient_id
        AND (
          NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM manager_supervisors ms 
            WHERE ms.supervisor_id = auth.uid() 
            AND ms.manager_id = p.assigned_manager
          )
        )
      )
    )
  );

CREATE POLICY "Access admission cycles through patient assignment" ON public.admission_cycles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = admission_cycles.patient_id 
      AND (patients.assigned_manager = auth.uid() OR has_role(auth.uid(), 'master'::user_role))
    )
  );

CREATE POLICY "Managers can manage admission cycles for their patients" ON public.admission_cycles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = admission_cycles.patient_id 
      AND patients.assigned_manager = auth.uid()
    )
  );

CREATE POLICY "Admins can view admission cycles based on supervisor relationships" ON public.admission_cycles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = admission_cycles.patient_id
        AND (
          NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM manager_supervisors ms 
            WHERE ms.supervisor_id = auth.uid() 
            AND ms.manager_id = p.assigned_manager
          )
        )
      )
    )
  );

CREATE POLICY "Access patient notes through patient assignment" ON public.patient_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = patient_notes.patient_id 
      AND (patients.assigned_manager = auth.uid() OR has_role(auth.uid(), 'master'::user_role))
    )
  );

CREATE POLICY "Managers can manage notes for their patients" ON public.patient_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = patient_notes.patient_id 
      AND patients.assigned_manager = auth.uid()
    )
  );

CREATE POLICY "Admins can view patient notes based on supervisor relationships" ON public.patient_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = patient_notes.patient_id
        AND (
          NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM manager_supervisors ms 
            WHERE ms.supervisor_id = auth.uid() 
            AND ms.manager_id = p.assigned_manager
          )
        )
      )
    )
  );

CREATE POLICY "Managers can view daily status for their patients" ON daily_patient_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = daily_patient_status.patient_id 
      AND (patients.assigned_manager = auth.uid() OR has_role(auth.uid(), 'master'::user_role))
    )
  );

CREATE POLICY "Managers can manage daily status for their patients" ON daily_patient_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = daily_patient_status.patient_id 
      AND patients.assigned_manager = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = daily_patient_status.patient_id 
      AND patients.assigned_manager = auth.uid()
    )
  );

CREATE POLICY "Admins can view daily status based on supervisor relationships" ON public.daily_patient_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = daily_patient_status.patient_id
        AND (
          NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM manager_supervisors ms 
            WHERE ms.supervisor_id = auth.uid() 
            AND ms.manager_id = p.assigned_manager
          )
        )
      )
    )
  );

CREATE POLICY "Access treatment plans through patient assignment" ON public.treatment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = treatment_plans.patient_id 
      AND (patients.assigned_manager = auth.uid() OR has_role(auth.uid(), 'master'::user_role))
    )
  );

CREATE POLICY "Managers can manage treatment plans for their patients" ON public.treatment_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = treatment_plans.patient_id 
      AND patients.assigned_manager = auth.uid()
    )
  );

CREATE POLICY "Admins can view treatment plans based on supervisor relationships" ON public.treatment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = treatment_plans.patient_id
        AND (
          NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM manager_supervisors ms 
            WHERE ms.supervisor_id = auth.uid() 
            AND ms.manager_id = p.assigned_manager
          )
        )
      )
    )
  );

CREATE POLICY "Anyone can view diagnosis options" ON public.diagnosis_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view hospital options" ON public.hospital_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view insurance type options" ON public.insurance_type_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view treatment detail options" ON public.treatment_detail_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only master can manage diagnosis options" ON public.diagnosis_options
  FOR ALL TO authenticated
  USING (is_master_user(auth.uid()))
  WITH CHECK (is_master_user(auth.uid()));

CREATE POLICY "Only master can manage hospital options" ON public.hospital_options
  FOR ALL TO authenticated
  USING (is_master_user(auth.uid()))
  WITH CHECK (is_master_user(auth.uid()));

CREATE POLICY "Only master can manage insurance type options" ON public.insurance_type_options
  FOR ALL TO authenticated
  USING (is_master_user(auth.uid()))
  WITH CHECK (is_master_user(auth.uid()));

CREATE POLICY "Only master can manage treatment detail options" ON public.treatment_detail_options
  FOR ALL TO authenticated
  USING (is_master_user(auth.uid()))
  WITH CHECK (is_master_user(auth.uid()));

CREATE POLICY "Anyone can view patient status options" ON public.patient_status_options
  FOR SELECT USING (true);

CREATE POLICY "Only master can manage patient status options" ON public.patient_status_options
  FOR ALL
  USING (is_master_user(auth.uid()))
  WITH CHECK (is_master_user(auth.uid()));

CREATE POLICY "Access reconnect tracking through patient assignment" ON public.patient_reconnect_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = patient_reconnect_tracking.patient_id
      AND (patients.assigned_manager = auth.uid() OR has_role(auth.uid(), 'master'::user_role))
    )
  );

CREATE POLICY "Managers can manage reconnect tracking for their patients" ON public.patient_reconnect_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = patient_reconnect_tracking.patient_id
      AND patients.assigned_manager = auth.uid()
    )
  );

CREATE POLICY "Admins can view reconnect tracking based on supervisor relationships" ON public.patient_reconnect_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = patient_reconnect_tracking.patient_id
        AND (
          NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM manager_supervisors ms 
            WHERE ms.supervisor_id = auth.uid() 
            AND ms.manager_id = p.assigned_manager
          )
        )
      )
    )
  );

CREATE POLICY "Managers can view package management for their patients" ON public.package_management
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = package_management.patient_id
        AND patients.assigned_manager = auth.uid()
    )
  );

CREATE POLICY "Managers can manage package management for their patients" ON public.package_management
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = package_management.patient_id
        AND patients.assigned_manager = auth.uid()
    )
  );

CREATE POLICY "Masters can view all package management" ON public.package_management
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'master'
        AND ur.approval_status = 'approved'
    )
  );

CREATE POLICY "Admins can view package management based on supervisor relationships" ON public.package_management
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = package_management.patient_id
        AND (
          NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM manager_supervisors ms 
            WHERE ms.supervisor_id = auth.uid() 
            AND ms.manager_id = p.assigned_manager
          )
        )
      )
    )
  );

CREATE POLICY "Managers can view package transactions for their patients" ON public.package_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = package_transactions.patient_id
      AND patients.assigned_manager = auth.uid()
    )
  );

CREATE POLICY "Managers can manage package transactions for their patients" ON public.package_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = package_transactions.patient_id
      AND patients.assigned_manager = auth.uid()
    )
  );

CREATE POLICY "Masters can view all package transactions" ON public.package_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'master'
      AND ur.approval_status = 'approved'
    )
  );

CREATE POLICY "Admins can view package transactions based on supervisor relationships" ON public.package_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.approval_status = 'approved'::approval_status
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = package_transactions.patient_id
        AND (
          NOT EXISTS (SELECT 1 FROM manager_supervisors WHERE supervisor_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM manager_supervisors ms 
            WHERE ms.supervisor_id = auth.uid() 
            AND ms.manager_id = p.assigned_manager
          )
        )
      )
    )
  );

CREATE POLICY "Masters can manage supervisor-manager relationships" ON public.manager_supervisors
  FOR ALL
  USING (is_master_user(auth.uid()))
  WITH CHECK (is_master_user(auth.uid()));

CREATE POLICY "Supervisors can view their managed managers" ON public.manager_supervisors
  FOR SELECT
  USING (auth.uid() = supervisor_id);

-- 인덱스 생성
CREATE INDEX idx_treatment_plans_patient_id ON public.treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_is_paid ON public.treatment_plans(is_paid);
CREATE INDEX idx_patients_management_status ON public.patients(management_status);
CREATE INDEX idx_patient_reconnect_tracking_patient_id ON public.patient_reconnect_tracking(patient_id);
CREATE INDEX idx_patient_reconnect_tracking_created_by ON public.patient_reconnect_tracking(created_by);
CREATE INDEX idx_package_management_patient_id ON public.package_management(patient_id);
CREATE INDEX idx_package_management_last_synced ON public.package_management(last_synced_at);
CREATE INDEX idx_package_transactions_patient ON public.package_transactions(patient_id);
CREATE INDEX idx_package_transactions_date ON public.package_transactions(transaction_date DESC);
CREATE INDEX idx_package_transactions_type ON public.package_transactions(transaction_type);

-- 예시 데이터 삽입
INSERT INTO public.diagnosis_options (name) VALUES
  ('폐암'), ('위암'), ('대장암'), ('간암'), ('유방암'),
  ('갑상선암'), ('췌장암'), ('담낭암'), ('신장암'), ('방광암');

INSERT INTO public.hospital_options (name) VALUES
  ('서울대병원'), ('삼성서울병원'), ('아산병원'), ('세브란스병원'),
  ('서울성모병원'), ('강남세브란스병원'), ('분당서울대병원'),
  ('고대안암병원'), ('고대구로병원'), ('경희대병원');

INSERT INTO public.insurance_type_options (name) VALUES
  ('실비보험'), ('암보험'), ('종합보험'), ('건강보험'),
  ('무보험'), ('실비+암보험'), ('기타');

INSERT INTO public.treatment_detail_options (name) VALUES
  ('고주파온열암치료'), ('싸이모신알파1'), ('미슬토주사'), ('셀레늄주사'),
  ('고농도비타민C'), ('면역증강주사'), ('해독재생치료'),
  ('항암부작용관리'), ('통증관리'), ('영양수액치료');

INSERT INTO public.patient_status_options (name, exclude_from_daily_tracking) VALUES
  ('관리 중', false), ('치료종료', true), ('상태악화', true), ('사망', true);