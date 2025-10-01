-- 손효준과 이미경의 ID 가져오기 및 랜덤 할당
DO $$
DECLARE
  son_id uuid;
  lee_id uuid;
  patient_record RECORD;
  random_manager uuid;
BEGIN
  -- 손효준과 이미경의 user_id 찾기
  SELECT id INTO son_id FROM public.profiles WHERE name = '손효준' LIMIT 1;
  SELECT id INTO lee_id FROM public.profiles WHERE name = '이미경' LIMIT 1;
  
  -- 두 실장이 모두 존재하는 경우에만 진행
  IF son_id IS NOT NULL AND lee_id IS NOT NULL THEN
    -- 모든 환자에 대해 랜덤 할당
    FOR patient_record IN 
      SELECT id FROM public.patients
    LOOP
      -- 랜덤하게 손효준 또는 이미경 선택
      IF random() < 0.5 THEN
        random_manager := son_id;
      ELSE
        random_manager := lee_id;
      END IF;
      
      -- 환자의 assigned_manager 업데이트
      UPDATE public.patients
      SET assigned_manager = random_manager
      WHERE id = patient_record.id;
    END LOOP;
    
    -- manager_name도 함께 업데이트
    UPDATE public.patients
    SET manager_name = profiles.name
    FROM public.profiles
    WHERE patients.assigned_manager = profiles.id;
  END IF;
END $$;