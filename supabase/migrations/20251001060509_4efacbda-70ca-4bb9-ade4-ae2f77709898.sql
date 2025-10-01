-- 2025년 8월, 9월, 10월 일별 환자 스케줄 생성
DO $$
DECLARE
  patient_record RECORD;
  processing_date DATE;
  end_date DATE := '2025-10-31';
  days_gap INTEGER;
  admission_start DATE;
  admission_days INTEGER;
  master_user_id UUID;
BEGIN
  -- 마스터 사용자 ID 가져오기
  SELECT id INTO master_user_id FROM public.profiles LIMIT 1;
  
  -- 유입 환자 전체에 대해 처리
  FOR patient_record IN 
    SELECT id, name, first_visit_date FROM public.patients WHERE inflow_status = '유입'
  LOOP
    -- 각 환자의 첫 방문일을 기준으로 시작
    processing_date := GREATEST('2025-08-01'::DATE, COALESCE(patient_record.first_visit_date, '2025-08-01'::DATE));
    
    -- 환자별로 랜덤한 패턴 생성
    WHILE processing_date <= end_date LOOP
      -- 30% 확률로 입원 기간 시작
      IF random() < 0.3 THEN
        admission_start := processing_date;
        admission_days := (random() * 10 + 5)::INTEGER;
        
        -- 입원 기간 동안 매일 기록
        FOR i IN 0..admission_days LOOP
          IF (admission_start + i) <= end_date THEN
            INSERT INTO public.daily_patient_status (
              patient_id, 
              status_date, 
              status_type, 
              created_by,
              notes
            ) VALUES (
              patient_record.id,
              admission_start + i,
              CASE 
                WHEN i = 0 THEN '입원'
                WHEN i = admission_days THEN '퇴원'
                ELSE '재원'
              END,
              master_user_id,
              CASE 
                WHEN i = 0 THEN '입원 시작'
                WHEN i = admission_days THEN '퇴원'
                ELSE '입원 치료 중'
              END
            )
            ON CONFLICT (patient_id, status_date) DO NOTHING;
          END IF;
        END LOOP;
        
        processing_date := admission_start + admission_days + 1;
        
      -- 40% 확률로 외래
      ELSIF random() < 0.7 THEN
        INSERT INTO public.daily_patient_status (
          patient_id, 
          status_date, 
          status_type, 
          created_by,
          notes
        ) VALUES (
          patient_record.id,
          processing_date,
          '외래',
          master_user_id,
          '외래 진료'
        )
        ON CONFLICT (patient_id, status_date) DO NOTHING;
        
        days_gap := (random() * 5 + 3)::INTEGER;
        processing_date := processing_date + days_gap;
        
      -- 20% 확률로 낮병동
      ELSIF random() < 0.9 THEN
        INSERT INTO public.daily_patient_status (
          patient_id, 
          status_date, 
          status_type, 
          created_by,
          notes
        ) VALUES (
          patient_record.id,
          processing_date,
          '낮병동',
          master_user_id,
          '낮병동 치료'
        )
        ON CONFLICT (patient_id, status_date) DO NOTHING;
        
        days_gap := (random() * 4 + 2)::INTEGER;
        processing_date := processing_date + days_gap;
        
      -- 10% 확률로 전화F/U
      ELSE
        INSERT INTO public.daily_patient_status (
          patient_id, 
          status_date, 
          status_type, 
          created_by,
          notes
        ) VALUES (
          patient_record.id,
          processing_date,
          '전화F/U',
          master_user_id,
          '전화 상담 진행'
        )
        ON CONFLICT (patient_id, status_date) DO NOTHING;
        
        days_gap := (random() * 7 + 7)::INTEGER;
        processing_date := processing_date + days_gap;
      END IF;
    END LOOP;
  END LOOP;
END $$;