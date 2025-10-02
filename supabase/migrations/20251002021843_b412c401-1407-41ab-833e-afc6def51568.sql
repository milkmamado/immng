-- rnjsdmsthf@naver.com 매니저에게 시뮬레이션 환자 10명 추가 (환자번호 401-410)
DO $$
DECLARE
  manager_id uuid;
  random_date timestamp;
BEGIN
  -- rnjsdmsthf@naver.com의 user_id 가져오기
  SELECT id INTO manager_id FROM auth.users WHERE email = 'rnjsdmsthf@naver.com';
  
  IF manager_id IS NULL THEN
    RAISE EXCEPTION 'rnjsdmsthf@naver.com 사용자를 찾을 수 없습니다.';
  END IF;

  -- 환자 1
  random_date := timestamp '2025-08-05 09:30:00';
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, 
    assigned_manager, counselor, inflow_status, 
    visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    previous_hospital, diet_info, 
    korean_doctor, western_doctor, counseling_content, chart_number,
    created_at
  ) VALUES (
    'P-2025-401', '김민수', '1978-03-15', '010-1111-5678',
    manager_id, '권은솔', '유입',
    '입원', '폐암 진단 후 통합치료 상담차 내원', '폐암', '비소세포폐암 3기',
    '서울대병원', '저염식, 고단백',
    '김한방', '이양방', '항암치료 중단 후 한방치료 병행 희망. 통증 관리 및 체력 회복 목표',
    'C-2025-401', random_date
  );

  -- 환자 2
  random_date := timestamp '2025-08-12 14:20:00';
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone,
    assigned_manager, counselor, inflow_status,
    visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    previous_hospital, diet_info,
    korean_doctor, western_doctor, counseling_content, chart_number,
    created_at
  ) VALUES (
    'P-2025-402', '박영희', '1971-07-22', '010-2222-6789',
    manager_id, '권은솔', '유입',
    '외래', '유방암 수술 후 재발 방지 목적', '유방암', '침윤성 유관암 2기',
    '삼성서울병원', '채식 위주',
    '박한방', '최양방', '항암 부작용 완화 및 면역력 증진 상담', 
    'C-2025-402', random_date
  );

  -- 환자 3
  random_date := timestamp '2025-08-18 10:45:00';
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone,
    assigned_manager, counselor, inflow_status,
    visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    previous_hospital, diet_info,
    korean_doctor, western_doctor, counseling_content, chart_number,
    created_at
  ) VALUES (
    'P-2025-403', '이철수', '1963-11-08', '010-3333-7890',
    manager_id, '권은솔', '유입',
    '입원', '간암 진행으로 집중 치료 필요', '간암', '간세포암 3기',
    '세브란스병원', '금주, 저지방',
    '정한방', '강양방', '통증 심해 입원치료 원함. 식욕부진 개선 필요',
    'C-2025-403', random_date
  );

  -- 환자 4
  random_date := timestamp '2025-08-25 13:15:00';
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone,
    assigned_manager, counselor, inflow_status,
    visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    previous_hospital, diet_info,
    korean_doctor, western_doctor, counseling_content, chart_number,
    created_at
  ) VALUES (
    'P-2025-404', '정미경', '1975-05-30', '010-4444-8901',
    manager_id, '권은솔', '유입',
    '외래', '위암 조기 발견 후 관리 목적', '위암', '조기 위암 1기',
    '아산병원', '부드러운 음식',
    '윤한방', '서양방', '수술 후 회복 단계, 정기 검진 예정',
    'C-2025-404', random_date
  );

  -- 환자 5
  random_date := timestamp '2025-09-03 11:00:00';
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone,
    assigned_manager, counselor, inflow_status,
    visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    previous_hospital, diet_info,
    korean_doctor, western_doctor, counseling_content, chart_number,
    created_at
  ) VALUES (
    'P-2025-405', '최승호', '1968-09-14', '010-5555-9012',
    manager_id, '권은솔', '유입',
    '입원', '대장암 항암 부작용 심해 한방 병행', '대장암', '직장암 3기',
    '강남세브란스', '고섬유질',
    '조한방', '홍양방', '구토, 설사 등 부작용 심함. 영양 상태 불량',
    'C-2025-405', random_date
  );

  -- 환자 6
  random_date := timestamp '2025-09-09 15:30:00';
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone,
    assigned_manager, counselor, inflow_status,
    visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    previous_hospital, diet_info,
    korean_doctor, western_doctor, counseling_content, chart_number,
    created_at
  ) VALUES (
    'P-2025-406', '강수진', '1981-12-25', '010-6666-0123',
    manager_id, '권은솔', '유입',
    '외래', '난소암 진단 후 치료 방향 상담', '난소암', '난소암 2기',
    '고대안암병원', '일반식',
    '한한방', '안양방', '수술 예정, 사전 체력 증진 및 면역 관리',
    'C-2025-406', random_date
  );

  -- 환자 7
  random_date := timestamp '2025-09-15 10:20:00';
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone,
    assigned_manager, counselor, inflow_status,
    visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    previous_hospital, diet_info,
    korean_doctor, western_doctor, counseling_content, chart_number,
    created_at
  ) VALUES (
    'P-2025-407', '윤동현', '1965-04-18', '010-7777-1234',
    manager_id, '권은솔', '유입',
    '입원', '전립선암 방사선 치료 중 컨디션 관리', '전립선암', '전립선암 2기',
    '분당서울대병원', '저자극식',
    '송한방', '배양방', '배뇨장애 및 피로감 호소. 방사선 부작용 관리 필요',
    'C-2025-407', random_date
  );

  -- 환자 8
  random_date := timestamp '2025-09-20 14:40:00';
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone,
    assigned_manager, counselor, inflow_status,
    visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    previous_hospital, diet_info,
    korean_doctor, western_doctor, counseling_content, chart_number,
    created_at
  ) VALUES (
    'P-2025-408', '임소연', '1973-08-07', '010-8888-2345',
    manager_id, '권은솔', '유입',
    '외래', '갑상선암 수술 후 정기 관리', '갑상선암', '갑상선 유두암 1기',
    '서울아산병원', '요오드 제한식',
    '임한방', '유양방', '수술 완료, 호르몬 균형 및 체력 관리 목적',
    'C-2025-408', random_date
  );

  -- 환자 9
  random_date := timestamp '2025-09-24 09:50:00';
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone,
    assigned_manager, counselor, inflow_status,
    visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    previous_hospital, diet_info,
    korean_doctor, western_doctor, counseling_content, chart_number,
    created_at
  ) VALUES (
    'P-2025-409', '한재민', '1960-01-30', '010-9999-3456',
    manager_id, '권은솔', '유입',
    '입원', '췌장암 말기 통증 관리 및 완화 치료', '췌장암', '췌장암 4기',
    '신촌세브란스', '유동식',
    '문한방', '민양방', '통증 심각, 삶의 질 향상 목표. 호스피스 고려 중',
    'C-2025-409', random_date
  );

  -- 환자 10
  random_date := timestamp '2025-09-28 16:10:00';
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone,
    assigned_manager, counselor, inflow_status,
    visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    previous_hospital, diet_info,
    korean_doctor, western_doctor, counseling_content, chart_number,
    created_at
  ) VALUES (
    'P-2025-410', '오혜진', '1977-06-12', '010-0000-4567',
    manager_id, '권은솔', '유입',
    '외래', '자궁경부암 조기 발견 후 예방 관리', '자궁경부암', '자궁경부암 1기',
    '건국대병원', '균형식',
    '권한방', '오양방', '조기 발견으로 치료 예후 양호. 정기 검진 예정',
    'C-2025-410', random_date
  );

END $$;