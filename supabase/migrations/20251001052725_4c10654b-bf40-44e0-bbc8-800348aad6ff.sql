-- 시뮬레이션용 30명의 초진 환자 데이터 생성
-- torogrr@kakao.com 계정의 user_id 가져오기
DO $$
DECLARE
  master_user_id uuid;
  patient_id_1 uuid;
  patient_id_2 uuid;
  patient_id_3 uuid;
  patient_id_4 uuid;
  patient_id_5 uuid;
  patient_id_6 uuid;
  patient_id_7 uuid;
  patient_id_8 uuid;
  patient_id_9 uuid;
  patient_id_10 uuid;
  patient_id_11 uuid;
  patient_id_12 uuid;
  patient_id_13 uuid;
  patient_id_14 uuid;
  patient_id_15 uuid;
  patient_id_16 uuid;
  patient_id_17 uuid;
  patient_id_18 uuid;
  patient_id_19 uuid;
  patient_id_20 uuid;
  patient_id_21 uuid;
  patient_id_22 uuid;
  patient_id_23 uuid;
  patient_id_24 uuid;
  patient_id_25 uuid;
  patient_id_26 uuid;
  patient_id_27 uuid;
  patient_id_28 uuid;
  patient_id_29 uuid;
  patient_id_30 uuid;
BEGIN
  -- torogrr@kakao.com의 user_id 가져오기
  SELECT id INTO master_user_id FROM auth.users WHERE email = 'torogrr@kakao.com';

  -- 환자 1: 폐암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-001', '김민수', '1965-03-15', '010-1234-5678', 'CH-2025-001',
    '유입', '외래', '지인 소개로 방문', '폐암', '비소세포폐암 3기',
    '김영희(배우자)', '서울대병원', '저염식, 고단백', '김한의', '최상담',
    '이양의', '항암 치료 상담 진행, 가족력 있음', CURRENT_DATE - 45, master_user_id
  ) RETURNING id INTO patient_id_1;

  -- 환자 2: 위암 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-002', '이영희', '1958-07-22', '010-2345-6789', 'CH-2025-002',
    '유입', '입원', '병원 홈페이지를 보고', '위암', '위암 2기',
    '이철수(자녀)', '삼성서울병원', '죽식, 유동식', '박한의', '정상담',
    '박양의', '수술 후 회복 치료 상담', CURRENT_DATE - 30, master_user_id
  ) RETURNING id INTO patient_id_2;

  -- 환자 3: 대장암 외래 환자 (이탈 리스크)
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, management_status, assigned_manager
  ) VALUES (
    'P-2025-003', '박지훈', '1972-11-08', '010-3456-7890', 'CH-2025-003',
    '유입', '외래', '광고를 보고', '대장암', '직장암 3기',
    '박미선(배우자)', '아산병원', '저섬유질 식단', '최한의', '김상담',
    '정양의', '치료 중단 의사 표현', CURRENT_DATE - 60, '이탈 위험', master_user_id
  ) RETURNING id INTO patient_id_3;

  -- 환자 4: 간암 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-004', '최수정', '1963-02-14', '010-4567-8901', 'CH-2025-004',
    '유입', '입원', '기존 환자 추천', '간암', '간세포암종 2기',
    '최영수(배우자)', '연세세브란스병원', '저단백 식단', '이한의', '최상담',
    '김양의', '간 이식 전 관리 상담', CURRENT_DATE - 20, master_user_id
  ) RETURNING id INTO patient_id_4;

  -- 환자 5: 유방암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-005', '정미영', '1968-09-30', '010-5678-9012', 'CH-2025-005',
    '유입', '외래', '온라인 검색', '유방암', '유방암 1기',
    '정민호(배우자)', '강남세브란스병원', '항산화 식단', '강한의', '이상담',
    '이양의', '조기 발견, 예후 양호', CURRENT_DATE - 15, master_user_id
  ) RETURNING id INTO patient_id_5;

  -- 환자 6: 췌장암 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-006', '강동원', '1960-05-18', '010-6789-0123', 'CH-2025-006',
    '유입', '입원', '응급실 내원', '췌장암', '췌장암 4기',
    '강은희(자녀)', '서울아산병원', '고열량 식단', '윤한의', '박상담',
    '최양의', '통증 관리 및 완화 치료', CURRENT_DATE - 10, master_user_id
  ) RETURNING id INTO patient_id_6;

  -- 환자 7: 갑상선암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-007', '윤서연', '1975-12-05', '010-7890-1234', 'CH-2025-007',
    '유입', '외래', '직장 동료 추천', '갑상선암', '갑상선 유두암',
    '환자 본인', '고려대병원', '요오드 제한 식단', '정한의', '김상담',
    '박양의', '수술 후 정기 검진', CURRENT_DATE - 50, master_user_id
  ) RETURNING id INTO patient_id_7;

  -- 환자 8: 전립선암 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-008', '임태권', '1955-08-21', '010-8901-2345', 'CH-2025-008',
    '유입', '입원', '건강검진 후 발견', '전립선암', '전립선암 3기',
    '임미경(배우자)', '서울대병원', '토마토 중심 식단', '한한의', '정상담',
    '강양의', '호르몬 치료 진행 중', CURRENT_DATE - 25, master_user_id
  ) RETURNING id INTO patient_id_8;

  -- 환자 9: 난소암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-009', '신혜진', '1970-04-17', '010-9012-3456', 'CH-2025-009',
    '유입', '외래', 'SNS 광고', '난소암', '난소암 2기',
    '신준호(배우자)', '서울성모병원', '균형 식단', '서한의', '최상담',
    '윤양의', '항암 치료 6회 완료', CURRENT_DATE - 35, master_user_id
  ) RETURNING id INTO patient_id_9;

  -- 환자 10: 혈액암 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-010', '오준석', '1980-06-29', '010-0123-4567', 'CH-2025-010',
    '유입', '입원', '타 병원 전원', '혈액암', '급성골수성백혈병',
    '오경희(부모)', '삼성서울병원', '무균 식단', '최한의', '이상담',
    '정양의', '골수 이식 대기 중', CURRENT_DATE - 5, master_user_id
  ) RETURNING id INTO patient_id_10;

  -- 환자 11: 폐암 외래 환자 (실패)
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, management_status, assigned_manager
  ) VALUES (
    'P-2025-011', '한지민', '1966-10-11', '010-1111-2222', 'CH-2025-011',
    '실패', '외래', '블로그 후기', '폐암', '소세포폐암',
    '환자 본인', '국립암센터', '저염식', '김한의', '박상담',
    '이양의', '비용 문제로 상담만 진행', CURRENT_DATE - 40, '상담 종료', master_user_id
  ) RETURNING id INTO patient_id_11;

  -- 환자 12: 위암 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-012', '배성우', '1962-03-25', '010-2222-3333', 'CH-2025-012',
    '유입', '입원', '의사 소개', '위암', '위암 3기',
    '배은경(자녀)', '아산병원', '부드러운 식단', '이한의', '김상담',
    '박양의', '수술 후 항암 치료 중', CURRENT_DATE - 28, master_user_id
  ) RETURNING id INTO patient_id_12;

  -- 환자 13: 대장암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-013', '송혜교', '1973-02-08', '010-3333-4444', 'CH-2025-013',
    '유입', '외래', '가족 추천', '대장암', '결장암 2기',
    '송민수(배우자)', '연세세브란스병원', '고섬유질 식단', '박한의', '정상담',
    '최양의', '정기 검진 진행 중', CURRENT_DATE - 42, master_user_id
  ) RETURNING id INTO patient_id_13;

  -- 환자 14: 간암 입원 환자 (이탈 리스크)
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, management_status, assigned_manager
  ) VALUES (
    'P-2025-014', '류준열', '1959-11-30', '010-4444-5555', 'CH-2025-014',
    '유입', '입원', '응급 내원', '간암', '간세포암종 4기',
    '류영희(배우자)', '서울대병원', '간 보호 식단', '강한의', '최상담',
    '김양의', '치료 거부 의사 표현', CURRENT_DATE - 18, '이탈 위험', master_user_id
  ) RETURNING id INTO patient_id_14;

  -- 환자 15: 유방암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-015', '전지현', '1971-05-14', '010-5555-6666', 'CH-2025-015',
    '유입', '외래', '지인 소개', '유방암', '유방암 2기',
    '전민철(배우자)', '강남세브란스병원', '저지방 식단', '정한의', '이상담',
    '이양의', '항암 치료 계획 수립', CURRENT_DATE - 22, master_user_id
  ) RETURNING id INTO patient_id_15;

  -- 환자 16: 췌장암 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-016', '조인성', '1964-07-19', '010-6666-7777', 'CH-2025-016',
    '유입', '입원', '타 병원 전원', '췌장암', '췌장암 3기',
    '조미선(자녀)', '삼성서울병원', '소화 용이 식단', '윤한의', '박상담',
    '최양의', '통증 관리 치료 중', CURRENT_DATE - 12, master_user_id
  ) RETURNING id INTO patient_id_16;

  -- 환자 17: 식도암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-017', '김태희', '1969-09-03', '010-7777-8888', 'CH-2025-017',
    '유입', '외래', '온라인 상담', '식도암', '식도암 2기',
    '김준호(배우자)', '고려대병원', '유동식 위주', '한한의', '김상담',
    '박양의', '방사선 치료 진행 중', CURRENT_DATE - 33, master_user_id
  ) RETURNING id INTO patient_id_17;

  -- 환자 18: 자궁경부암 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-018', '박신혜', '1967-12-20', '010-8888-9999', 'CH-2025-018',
    '유입', '입원', '정기 검진 후 발견', '자궁경부암', '자궁경부암 3기',
    '박영수(배우자)', '서울성모병원', '균형 잡힌 식단', '서한의', '정상담',
    '윤양의', '수술 후 회복 중', CURRENT_DATE - 16, master_user_id
  ) RETURNING id INTO patient_id_18;

  -- 환자 19: 방광암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-019', '이병헌', '1961-04-07', '010-9999-0000', 'CH-2025-019',
    '유입', '외래', '건강검진 후', '방광암', '방광암 1기',
    '환자 본인', '아산병원', '수분 섭취 증가', '최한의', '최상담',
    '정양의', '조기 발견으로 예후 양호', CURRENT_DATE - 27, master_user_id
  ) RETURNING id INTO patient_id_19;

  -- 환자 20: 신장암 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-020', '김수현', '1974-08-16', '010-0000-1111', 'CH-2025-020',
    '유입', '입원', '응급실 내원', '신장암', '신세포암 2기',
    '김은희(배우자)', '연세세브란스병원', '저단백 식단', '이한의', '이상담',
    '김양의', '수술 예정', CURRENT_DATE - 8, master_user_id
  ) RETURNING id INTO patient_id_20;

  -- 환자 21: 폐암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-021', '하정우', '1968-01-29', '010-1111-0000', 'CH-2025-021',
    '유입', '외래', '의사 추천', '폐암', '폐선암 2기',
    '하민정(배우자)', '서울대병원', '항산화 식단', '박한의', '박상담',
    '이양의', '표적 치료 진행 중', CURRENT_DATE - 38, master_user_id
  ) RETURNING id INTO patient_id_21;

  -- 환자 22: 위암 입원 환자 (실패)
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, management_status, assigned_manager
  ) VALUES (
    'P-2025-022', '공유', '1963-06-12', '010-2222-1111', 'CH-2025-022',
    '실패', '입원', '블로그 검색', '위암', '위암 4기',
    '공은희(자녀)', '삼성서울병원', '영양 죽', '강한의', '김상담',
    '박양의', '경제적 사유로 입원 취소', CURRENT_DATE - 55, '상담 종료', master_user_id
  ) RETURNING id INTO patient_id_22;

  -- 환자 23: 대장암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-023', '마동석', '1970-10-24', '010-3333-2222', 'CH-2025-023',
    '유입', '외래', '지인 추천', '대장암', '직장암 1기',
    '환자 본인', '국립암센터', '채소 중심 식단', '정한의', '정상담',
    '최양의', '수술 후 경과 관찰', CURRENT_DATE - 48, master_user_id
  ) RETURNING id INTO patient_id_23;

  -- 환자 24: 뇌종양 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-024', '이민호', '1965-11-05', '010-4444-3333', 'CH-2025-024',
    '유입', '입원', '응급 내원', '뇌종양', '교모세포종',
    '이수진(배우자)', '서울대병원', '영양 보충 식단', '한한의', '최상담',
    '정양의', '방사선 치료 중', CURRENT_DATE - 14, master_user_id
  ) RETURNING id INTO patient_id_24;

  -- 환자 25: 피부암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-025', '수지', '1977-03-18', '010-5555-4444', 'CH-2025-025',
    '유입', '외래', '온라인 광고', '피부암', '악성 흑색종',
    '환자 본인', '고려대병원', '항산화 식품', '서한의', '이상담',
    '윤양의', '조기 치료 시작', CURRENT_DATE - 21, master_user_id
  ) RETURNING id INTO patient_id_25;

  -- 환자 26: 담낭암 입원 환자 (이탈 리스크)
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, management_status, assigned_manager
  ) VALUES (
    'P-2025-026', '차태현', '1956-09-27', '010-6666-5555', 'CH-2025-026',
    '유입', '입원', '타 병원 전원', '담낭암', '담낭암 3기',
    '차미경(배우자)', '아산병원', '저지방 식단', '최한의', '박상담',
    '김양의', '연락 두절 상태', CURRENT_DATE - 52, '이탈 위험', master_user_id
  ) RETURNING id INTO patient_id_26;

  -- 환자 27: 후두암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-027', '유아인', '1972-12-09', '010-7777-6666', 'CH-2025-027',
    '유입', '외래', 'SNS 추천', '후두암', '후두암 2기',
    '유민수(가족)', '서울성모병원', '부드러운 음식', '이한의', '김상담',
    '박양의', '음성 보존 치료 중', CURRENT_DATE - 31, master_user_id
  ) RETURNING id INTO patient_id_27;

  -- 환자 28: 골육종 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-028', '박보검', '1982-04-02', '010-8888-7777', 'CH-2025-028',
    '유입', '입원', '정형외과 의뢰', '골육종', '대퇴골 골육종',
    '박영희(부모)', '연세세브란스병원', '고칼슘 식단', '박한의', '정상담',
    '이양의', '항암 치료 및 수술 계획', CURRENT_DATE - 9, master_user_id
  ) RETURNING id INTO patient_id_28;

  -- 환자 29: 담도암 외래 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-029', '이나영', '1969-05-23', '010-9999-8888', 'CH-2025-029',
    '유입', '외래', '가족 소개', '담도암', '담도암 2기',
    '이준호(배우자)', '삼성서울병원', '소화 용이 식단', '강한의', '최상담',
    '최양의', '항암 치료 계획 중', CURRENT_DATE - 26, master_user_id
  ) RETURNING id INTO patient_id_29;

  -- 환자 30: 림프종 입원 환자
  INSERT INTO public.patients (
    patient_number, name, birth_date, phone, chart_number,
    inflow_status, visit_type, visit_motivation, diagnosis, detailed_diagnosis,
    guardian_name, previous_hospital, diet_info, korean_doctor, counselor,
    western_doctor, counseling_content, first_visit_date, assigned_manager
  ) VALUES (
    'P-2025-030', '정우성', '1976-07-11', '010-0000-9999', 'CH-2025-030',
    '유입', '입원', '건강검진 후 발견', '림프종', '호지킨림프종',
    '정은희(배우자)', '서울대병원', '면역 강화 식단', '정한의', '이상담',
    '정양의', '항암 치료 시작', CURRENT_DATE - 7, master_user_id
  ) RETURNING id INTO patient_id_30;

  -- 일별 환자 상태 기록 (다양한 날짜와 상태)
  -- 환자 1-10: 최근 2주간 다양한 상태
  INSERT INTO public.daily_patient_status (patient_id, status_date, status_type, notes, created_by)
  VALUES
    (patient_id_1, CURRENT_DATE - 1, '외래', '항암 치료 6차 진행', master_user_id),
    (patient_id_1, CURRENT_DATE - 8, '외래', '항암 치료 5차 진행', master_user_id),
    (patient_id_2, CURRENT_DATE - 2, '입원', '회복 치료 중', master_user_id),
    (patient_id_2, CURRENT_DATE - 9, '입원', '안정적 상태 유지', master_user_id),
    (patient_id_3, CURRENT_DATE - 15, '외래', '치료 중단 의사 표현', master_user_id),
    (patient_id_4, CURRENT_DATE - 3, '입원', '간 기능 검사 진행', master_user_id),
    (patient_id_5, CURRENT_DATE - 5, '외래', '정기 검진 양호', master_user_id),
    (patient_id_6, CURRENT_DATE - 4, '입원', '통증 관리 진행', master_user_id),
    (patient_id_7, CURRENT_DATE - 6, '외래', '수술 후 정기 검진', master_user_id),
    (patient_id_8, CURRENT_DATE - 7, '입원', '호르몬 치료 진행', master_user_id),
    (patient_id_9, CURRENT_DATE - 10, '외래', '항암 치료 완료', master_user_id),
    (patient_id_10, CURRENT_DATE - 1, '입원', '골수 이식 준비', master_user_id);

  -- 환자 11-20: 다양한 주기로 상태 기록
  INSERT INTO public.daily_patient_status (patient_id, status_date, status_type, notes, created_by)
  VALUES
    (patient_id_12, CURRENT_DATE - 2, '입원', '항암 치료 진행 중', master_user_id),
    (patient_id_13, CURRENT_DATE - 4, '외래', '정기 검진 정상', master_user_id),
    (patient_id_14, CURRENT_DATE - 20, '입원', '치료 거부 의사', master_user_id),
    (patient_id_15, CURRENT_DATE - 3, '외래', '항암 치료 계획 수립', master_user_id),
    (patient_id_16, CURRENT_DATE - 5, '입원', '통증 관리 효과적', master_user_id),
    (patient_id_17, CURRENT_DATE - 6, '외래', '방사선 치료 진행', master_user_id),
    (patient_id_18, CURRENT_DATE - 7, '입원', '수술 후 회복 중', master_user_id),
    (patient_id_19, CURRENT_DATE - 8, '외래', '조기 발견 예후 양호', master_user_id),
    (patient_id_20, CURRENT_DATE - 2, '입원', '수술 전 준비', master_user_id);

  -- 환자 21-30: 최근 상태 기록
  INSERT INTO public.daily_patient_status (patient_id, status_date, status_type, notes, created_by)
  VALUES
    (patient_id_21, CURRENT_DATE - 3, '외래', '표적 치료 효과 확인', master_user_id),
    (patient_id_23, CURRENT_DATE - 5, '외래', '수술 후 경과 양호', master_user_id),
    (patient_id_24, CURRENT_DATE - 4, '입원', '방사선 치료 진행', master_user_id),
    (patient_id_25, CURRENT_DATE - 6, '외래', '조기 치료 시작', master_user_id),
    (patient_id_26, CURRENT_DATE - 25, '입원', '연락 두절', master_user_id),
    (patient_id_27, CURRENT_DATE - 7, '외래', '음성 보존 치료', master_user_id),
    (patient_id_28, CURRENT_DATE - 2, '입원', '항암 치료 시작', master_user_id),
    (patient_id_29, CURRENT_DATE - 8, '외래', '항암 치료 계획', master_user_id),
    (patient_id_30, CURRENT_DATE - 1, '입원', '항암 치료 1차 완료', master_user_id);

  -- 이탈 리스크 환자 추적 (환자 3, 14, 26)
  INSERT INTO public.patient_reconnect_tracking (patient_id, is_reconnected, reconnect_notes, created_by)
  VALUES
    (patient_id_3, false, '여러 차례 연락 시도, 전화 미수신. 치료 중단 의사 표현함', master_user_id),
    (patient_id_14, false, '치료 거부 의사 명확. 가족과 상담 필요', master_user_id),
    (patient_id_26, false, '3주 이상 연락 두절. 보호자 연락 시도 중', master_user_id);

  -- 일부 환자는 재연결 성공
  INSERT INTO public.patient_reconnect_tracking (patient_id, is_reconnected, reconnected_at, reconnect_notes, created_by)
  VALUES
    (patient_id_21, true, CURRENT_DATE - 10, '초기 치료 중단 후 재상담으로 치료 재개', master_user_id),
    (patient_id_13, true, CURRENT_DATE - 20, '경제적 사유로 중단했으나 보험 처리 후 재개', master_user_id);

END $$;