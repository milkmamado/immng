-- 계정 관리 시스템 뷰와 함수들 생성

-- 관리자 승인 관련 뷰 생성
CREATE OR REPLACE VIEW public.pending_approvals AS
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.approval_status,
  ur.created_at as requested_at,
  p.name,
  p.email,
  p.phone
FROM public.user_roles ur
LEFT JOIN public.profiles p ON ur.user_id = p.id
WHERE ur.approval_status = 'pending';

-- 승인된 사용자 목록 뷰
CREATE OR REPLACE VIEW public.approved_users AS
SELECT 
  ur.id as role_id,
  ur.user_id,
  ur.role,
  ur.approval_status,
  ur.approved_at,
  ur.approved_by,
  p.name,
  p.email,
  p.phone,
  p.created_at as joined_at,
  approver.name as approved_by_name
FROM public.user_roles ur
LEFT JOIN public.profiles p ON ur.user_id = p.id
LEFT JOIN public.profiles approver ON ur.approved_by = approver.id
WHERE ur.approval_status = 'approved';

-- 매니저별 환자 통계 뷰 (마스터와 어드민이 볼 수 있음)
CREATE OR REPLACE VIEW public.manager_patient_stats AS
SELECT 
  p.id as manager_id,
  p.name as manager_name,
  p.email as manager_email,
  COUNT(pt.id) as total_patients,
  COUNT(CASE WHEN pt.created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as new_patients_this_month,
  COUNT(CASE WHEN pt.first_visit_date >= DATE_TRUNC('week', NOW()) THEN 1 END) as visits_this_week,
  COALESCE(SUM(pkg.total_cost), 0) as total_revenue,
  COALESCE(SUM(pkg.outstanding_balance), 0) as outstanding_balance,
  MAX(pt.created_at) as last_patient_added
FROM public.profiles p
INNER JOIN public.user_roles ur ON p.id = ur.user_id 
LEFT JOIN public.patients pt ON p.id = pt.assigned_manager
LEFT JOIN public.packages pkg ON pt.id = pkg.patient_id
WHERE ur.role = 'manager' AND ur.approval_status = 'approved'
GROUP BY p.id, p.name, p.email
ORDER BY total_patients DESC;

-- 마스터와 어드민만 계정 관리할 수 있도록 함수 생성
CREATE OR REPLACE FUNCTION public.can_manage_accounts(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('master', 'admin')
    AND approval_status = 'approved'
  );
$$;