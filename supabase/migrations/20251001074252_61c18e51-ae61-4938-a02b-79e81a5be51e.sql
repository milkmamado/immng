-- patient_status_options 테이블에 아웃위기, 아웃 상태 추가
-- 이미 존재하는 경우 건너뛰기
DO $$
BEGIN
  -- 아웃위기가 없으면 추가
  IF NOT EXISTS (SELECT 1 FROM public.patient_status_options WHERE name = '아웃위기') THEN
    INSERT INTO public.patient_status_options (name, exclude_from_daily_tracking)
    VALUES ('아웃위기', false);
  END IF;

  -- 아웃이 없으면 추가
  IF NOT EXISTS (SELECT 1 FROM public.patient_status_options WHERE name = '아웃') THEN
    INSERT INTO public.patient_status_options (name, exclude_from_daily_tracking)
    VALUES ('아웃', true);
  END IF;
END $$;