-- pending_approvals 뷰를 branch 정보 포함하도록 재생성
DROP VIEW IF EXISTS pending_approvals;

CREATE VIEW pending_approvals AS
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.branch,
  ur.approval_status,
  ur.created_at as requested_at,
  p.name,
  p.email,
  p.phone,
  au.created_at as joined_at
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
JOIN auth.users au ON au.id = ur.user_id
WHERE ur.approval_status = 'pending';

-- approved_users 뷰를 branch 정보 포함하도록 재생성
DROP VIEW IF EXISTS approved_users;

CREATE VIEW approved_users AS
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.branch,
  ur.approval_status,
  ur.created_at as requested_at,
  ur.approved_at,
  p.name,
  p.email,
  p.phone,
  au.created_at as joined_at,
  approver.name as approved_by_name
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN profiles approver ON approver.id = ur.approved_by
WHERE ur.approval_status = 'approved';