-- 이탈 위험 환자들의 마지막 체크를 2주 이상 전으로 조정
DO $$
DECLARE
  risk_patient_id UUID;
BEGIN
  -- 이탈 위험 환자 3명에 대해 처리
  FOR risk_patient_id IN 
    SELECT id FROM public.patients 
    WHERE inflow_status = '유입' AND management_status = '이탈 위험'
  LOOP
    -- 해당 환자의 10월 이후 스케줄 모두 삭제
    DELETE FROM public.daily_patient_status
    WHERE patient_id = risk_patient_id 
      AND status_date >= '2025-10-01';
      
    -- 9월 중순 이후 스케줄도 삭제하여 2주 이상 공백 만들기
    DELETE FROM public.daily_patient_status
    WHERE patient_id = risk_patient_id 
      AND status_date >= '2025-09-16';
  END LOOP;
END $$;