-- 개발용 유틸리티 함수들

-- 환자 번호 생성 함수
CREATE OR REPLACE FUNCTION public.generate_patient_number()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'P-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((SELECT COALESCE(MAX(RIGHT(patient_number, 3))::INTEGER, 0) + 1 FROM public.patients WHERE patient_number LIKE 'P-' || TO_CHAR(NOW(), 'YYYY') || '-%')::TEXT, 3, '0');
$$;

-- 환자 상태 추적용 뷰 생성
CREATE OR REPLACE VIEW public.patient_summary AS
SELECT 
  p.id,
  p.patient_number,
  p.name,
  p.age,
  p.gender,
  p.phone,
  p.assigned_manager,
  p.first_visit_date,
  p.visit_type,
  m.cancer_type,
  m.cancer_stage,
  pkg.package_type,
  pkg.total_cost,
  pkg.outstanding_balance,
  prof.name as manager_name,
  p.created_at,
  p.updated_at
FROM public.patients p
LEFT JOIN public.medical_info m ON p.id = m.patient_id
LEFT JOIN public.packages pkg ON p.id = pkg.patient_id
LEFT JOIN public.profiles prof ON p.assigned_manager = prof.id;

-- 매니저 통계용 뷰 생성 (마스터용)
CREATE OR REPLACE VIEW public.manager_stats AS
SELECT 
  prof.id,
  prof.name as manager_name,
  prof.email,
  COUNT(p.id) as total_patients,
  COUNT(CASE WHEN p.created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as new_patients_this_month,
  COALESCE(SUM(pkg.total_cost), 0) as total_revenue,
  COALESCE(SUM(pkg.outstanding_balance), 0) as total_outstanding
FROM public.profiles prof
INNER JOIN public.user_roles ur ON prof.id = ur.user_id AND ur.role = 'manager'
LEFT JOIN public.patients p ON prof.id = p.assigned_manager
LEFT JOIN public.packages pkg ON p.id = pkg.patient_id
GROUP BY prof.id, prof.name, prof.email;