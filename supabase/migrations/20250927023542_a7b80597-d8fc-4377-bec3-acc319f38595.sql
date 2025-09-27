-- 보안 문제 수정: SECURITY DEFINER 제거

-- 환자 상태 추적용 뷰 재생성 (SECURITY INVOKER로)
DROP VIEW IF EXISTS public.patient_summary;
CREATE VIEW public.patient_summary WITH (security_invoker = true) AS
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

-- 매니저 통계용 뷰 재생성 (SECURITY INVOKER로)
DROP VIEW IF EXISTS public.manager_stats;
CREATE VIEW public.manager_stats WITH (security_invoker = true) AS
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