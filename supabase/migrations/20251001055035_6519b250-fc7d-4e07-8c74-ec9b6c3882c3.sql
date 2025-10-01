-- 모든 환자의 payment_amount를 재계산하여 업데이트
DO $$
DECLARE
  patient_record RECORD;
  total_paid NUMERIC;
BEGIN
  -- 모든 환자에 대해 반복
  FOR patient_record IN 
    SELECT id FROM public.patients
  LOOP
    -- 해당 환자의 is_paid=true인 치료계획의 총액 계산
    SELECT COALESCE(SUM(treatment_amount), 0) INTO total_paid
    FROM public.treatment_plans
    WHERE patient_id = patient_record.id
      AND is_paid = true;
    
    -- 환자의 payment_amount 업데이트
    UPDATE public.patients
    SET payment_amount = total_paid
    WHERE id = patient_record.id;
  END LOOP;
END $$;