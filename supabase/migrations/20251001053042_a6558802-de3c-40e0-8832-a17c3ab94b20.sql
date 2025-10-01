-- 생성된 환자들의 공란 필드(insurance_type, hospital_treatment 등)를 랜덤 데이터로 채우기
DO $$
DECLARE
  patient_record RECORD;
  insurance_types TEXT[] := ARRAY['실손보험', '암보험', '종합보험', '건강보험+실손', '건강보험'];
  hospital_treatments TEXT[] := ARRAY['항암화학요법', '방사선치료', '수술', '면역치료', '표적치료', '호르몬치료', '통증관리', '완화치료'];
BEGIN
  -- P-2025로 시작하는 환자들 업데이트
  FOR patient_record IN 
    SELECT id FROM public.patients 
    WHERE patient_number LIKE 'P-2025-%'
  LOOP
    UPDATE public.patients
    SET 
      insurance_type = CASE 
        WHEN random() < 0.3 THEN insurance_types[1 + floor(random() * 5)::int]
        ELSE insurance_type
      END,
      hospital_treatment = CASE 
        WHEN random() < 0.7 THEN hospital_treatments[1 + floor(random() * 8)::int]
        ELSE hospital_treatment
      END
    WHERE id = patient_record.id;
  END LOOP;
END $$;