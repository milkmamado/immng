-- 일별 환자 상태 추적 시 마지막내원일 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_last_visit_date()
RETURNS TRIGGER AS $$
BEGIN
  -- 입원, 재원, 낮병동, 외래 상태일 때만 마지막내원일 업데이트
  IF NEW.status_type IN ('입원', '재원', '낮병동', '외래') THEN
    UPDATE public.patients
    SET last_visit_date = NEW.status_date
    WHERE id = NEW.patient_id
      AND (last_visit_date IS NULL OR last_visit_date < NEW.status_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public';

-- 트리거 생성: daily_patient_status에 INSERT 또는 UPDATE 시 실행
DROP TRIGGER IF EXISTS trigger_update_last_visit_date ON public.daily_patient_status;
CREATE TRIGGER trigger_update_last_visit_date
  AFTER INSERT OR UPDATE ON public.daily_patient_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_visit_date();

-- 기존 데이터에 대해 마지막내원일 업데이트 (한 번만 실행)
UPDATE public.patients p
SET last_visit_date = (
  SELECT MAX(dps.status_date)
  FROM public.daily_patient_status dps
  WHERE dps.patient_id = p.id
    AND dps.status_type IN ('입원', '재원', '낮병동', '외래')
)
WHERE EXISTS (
  SELECT 1
  FROM public.daily_patient_status dps
  WHERE dps.patient_id = p.id
    AND dps.status_type IN ('입원', '재원', '낮병동', '외래')
);