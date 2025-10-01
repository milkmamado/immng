-- 이탈 리스크 환자 재연락 추적 테이블 생성
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

-- RLS 활성화
ALTER TABLE public.patient_reconnect_tracking ENABLE ROW LEVEL SECURITY;

-- 담당 매니저와 마스터만 조회 가능
CREATE POLICY "Access reconnect tracking through patient assignment"
ON public.patient_reconnect_tracking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_reconnect_tracking.patient_id
    AND (patients.assigned_manager = auth.uid() OR has_role(auth.uid(), 'master'::user_role))
  )
);

-- 담당 매니저만 관리 가능
CREATE POLICY "Managers can manage reconnect tracking for their patients"
ON public.patient_reconnect_tracking
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_reconnect_tracking.patient_id
    AND patients.assigned_manager = auth.uid()
  )
);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_patient_reconnect_tracking_updated_at
BEFORE UPDATE ON public.patient_reconnect_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 인덱스 생성
CREATE INDEX idx_patient_reconnect_tracking_patient_id ON public.patient_reconnect_tracking(patient_id);
CREATE INDEX idx_patient_reconnect_tracking_created_by ON public.patient_reconnect_tracking(created_by);