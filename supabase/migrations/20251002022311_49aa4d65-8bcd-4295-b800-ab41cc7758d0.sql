
-- rnjsdmsthf@naver.com (권은솔) 매니저의 환자 데이터 업데이트
-- counselor 필드를 "환자"로, manager_name 필드를 "권은솔"로 변경

UPDATE patients
SET 
  counselor = '환자',
  manager_name = '권은솔',
  updated_at = NOW()
WHERE assigned_manager = 'f23d664a-7bd0-4c8c-a06e-186dd18ab048';
