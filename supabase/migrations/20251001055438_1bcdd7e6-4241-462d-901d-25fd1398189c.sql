-- 담당실장이 없는 환자들에게 김효진 또는 주현정을 랜덤으로 할당
DO $$
DECLARE
  kim_id uuid;
  joo_id uuid;
  patient_record RECORD;
  random_manager uuid;
BEGIN
  -- 김효진과 주현정의 user_id 찾기
  SELECT id INTO kim_id FROM public.profiles WHERE name = '김효진' LIMIT 1;
  SELECT id INTO joo_id FROM public.profiles WHERE name = '주현정' LIMIT 1;
  
  -- 두 실장이 모두 존재하는 경우에만 진행
  IF kim_id IS NOT NULL AND joo_id IS NOT NULL THEN
    -- assigned_manager가 null이거나 존재하지 않는 user_id를 가진 환자들 업데이트
    FOR patient_record IN 
      SELECT id FROM public.patients 
      WHERE assigned_manager IS NULL 
         OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = patients.assigned_manager)
    LOOP
      -- 랜덤하게 김효진 또는 주현정 선택
      IF random() < 0.5 THEN
        random_manager := kim_id;
      ELSE
        random_manager := joo_id;
      END IF;
      
      -- 환자의 assigned_manager 업데이트
      UPDATE public.patients
      SET assigned_manager = random_manager
      WHERE id = patient_record.id;
    END LOOP;
  END IF;
END $$;