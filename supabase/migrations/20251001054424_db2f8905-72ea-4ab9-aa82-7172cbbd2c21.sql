-- 생성된 환자들에게 치료계획 데이터 랜덤 추가
DO $$
DECLARE
  patient_record RECORD;
  treatment_options TEXT[];
  num_treatments INT;
  i INT;
  selected_treatment TEXT;
  random_amount NUMERIC;
  random_paid BOOLEAN;
  random_date DATE;
BEGIN
  -- treatment_detail_options에서 옵션 가져오기
  SELECT ARRAY_AGG(name) INTO treatment_options 
  FROM public.treatment_detail_options;
  
  -- 옵션이 없으면 기본값 사용
  IF treatment_options IS NULL OR array_length(treatment_options, 1) IS NULL THEN
    treatment_options := ARRAY['고주파온열암치료', '고농도비타민C', '미슬토주사', '셀레늄주사', '면역주사'];
  END IF;

  -- P-2025로 시작하는 환자들에 대해 치료계획 추가
  FOR patient_record IN 
    SELECT id, assigned_manager FROM public.patients 
    WHERE patient_number LIKE 'P-2025-%'
  LOOP
    -- 각 환자당 1-3개의 치료계획 생성
    num_treatments := 1 + floor(random() * 3)::int;
    
    FOR i IN 1..num_treatments LOOP
      -- 랜덤 치료 선택
      selected_treatment := treatment_options[1 + floor(random() * array_length(treatment_options, 1))::int];
      
      -- 랜덤 금액 (50,000 ~ 500,000)
      random_amount := (50000 + floor(random() * 450000)::int);
      
      -- 랜덤 결제 여부 (70% 확률로 결제됨)
      random_paid := random() < 0.7;
      
      -- 결제된 경우 랜덤 날짜 (최근 60일 이내)
      IF random_paid THEN
        random_date := CURRENT_DATE - floor(random() * 60)::int;
      ELSE
        random_date := NULL;
      END IF;
      
      -- 치료계획 삽입
      INSERT INTO public.treatment_plans (
        patient_id,
        treatment_detail,
        treatment_amount,
        is_paid,
        payment_date,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        patient_record.id,
        selected_treatment,
        random_amount,
        random_paid,
        random_date,
        patient_record.assigned_manager,
        NOW() - (floor(random() * 30) || ' days')::interval,
        NOW()
      );
    END LOOP;
  END LOOP;
END $$;