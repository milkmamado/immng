-- Create view for approved users
CREATE OR REPLACE VIEW approved_users AS
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.approval_status,
  ur.created_at as requested_at,
  ur.created_at as approved_at,
  p.name,
  p.email,
  p.phone,
  p.created_at as joined_at,
  approver.name as approved_by_name
FROM user_roles ur
INNER JOIN profiles p ON p.id = ur.user_id
LEFT JOIN user_roles approver_role ON approver_role.id = ur.assigned_by
LEFT JOIN profiles approver ON approver.id = approver_role.user_id
WHERE ur.approval_status = 'approved';

-- Create view for pending approvals
CREATE OR REPLACE VIEW pending_approvals AS
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.approval_status,
  ur.created_at as requested_at,
  p.name,
  p.email,
  p.phone,
  p.created_at as joined_at
FROM user_roles ur
INNER JOIN profiles p ON p.id = ur.user_id
WHERE ur.approval_status = 'pending';

-- Create view for manager patient statistics
CREATE OR REPLACE VIEW manager_patient_stats AS
SELECT 
  p.id as manager_id,
  p.name as manager_name,
  p.email as manager_email,
  COUNT(DISTINCT pat.id) as total_patients,
  COUNT(DISTINCT CASE 
    WHEN pat.created_at >= date_trunc('month', CURRENT_DATE) 
    THEN pat.id 
  END) as new_patients_this_month,
  COUNT(DISTINCT CASE 
    WHEN pat.first_visit_date >= date_trunc('week', CURRENT_DATE) 
    THEN pat.id 
  END) as visits_this_week,
  COALESCE(SUM(pkg.patient_payment), 0) as total_revenue,
  COALESCE(SUM(pkg.outstanding_balance), 0) as outstanding_balance,
  MAX(pat.created_at) as last_patient_added
FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN patients pat ON pat.assigned_manager = p.id
LEFT JOIN packages pkg ON pkg.patient_id = pat.id
WHERE ur.role = 'manager' AND ur.approval_status = 'approved'
GROUP BY p.id, p.name, p.email;