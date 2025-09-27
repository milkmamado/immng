-- 입퇴원 사이클 관리 테이블 생성 (수정된 버전)
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

-- 환자 메모/코멘트 테이블 생성
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

-- 기존 테이블들에 admission_cycle_id 추가
ALTER TABLE public.packages ADD COLUMN admission_cycle_id UUID REFERENCES public.admission_cycles(id) ON DELETE SET NULL;
ALTER TABLE public.medical_info ADD COLUMN admission_cycle_id UUID REFERENCES public.admission_cycles(id) ON DELETE SET NULL;
ALTER TABLE public.treatment_history ADD COLUMN admission_cycle_id UUID REFERENCES public.admission_cycles(id) ON DELETE SET NULL;

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

-- RLS 정책 설정
ALTER TABLE public.admission_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

-- admission_cycles 정책
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

-- patient_notes 정책  
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

-- 자동 업데이트 트리거
CREATE TRIGGER update_admission_cycles_updated_at
  BEFORE UPDATE ON public.admission_cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_notes_updated_at
  BEFORE UPDATE ON public.patient_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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