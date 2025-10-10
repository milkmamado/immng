-- 권은솔 매니저(rnjsdmsthf@naver.com)에게 시뮬레이션 환자 추가
INSERT INTO patients (
  name, customer_number, phone, gender, age,
  diagnosis_category, diagnosis_detail,
  hospital_category, hospital_branch,
  visit_motivation, address, inflow_status,
  first_visit_date, visit_type,
  assigned_manager, management_status,
  patient_or_guardian, crm_memo
) VALUES 
(
  '김영희', 'C-2025-001', '010-1234-5678', 'F', 45,
  '암', '유방암',
  '삼성병원', '강북',
  '블로그', '서울시 강남구 테헤란로 123', '유입',
  '2025-01-15', '입원',
  'f23d664a-7bd0-4c8c-a06e-186dd18ab048', '관리 중',
  '환자', '블로그를 통해 내원. 유방암 3기 진단 후 적극적 치료 희망'
),
(
  '이철수', 'C-2025-002', '010-9876-5432', 'M', 52,
  '암', '위암',
  '서울아산병원', '송파',
  '홈페이지', '서울시 서초구 서초대로 456', '유입',
  '2025-02-20', '외래',
  'f23d664a-7bd0-4c8c-a06e-186dd18ab048', '관리 중',
  '환자', '홈페이지 상담 후 내원. 위암 2기 진단 후 한방치료 병행 희망'
);