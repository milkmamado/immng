-- manager_patient_stats 뷰를 branch 정보 포함하도록 재생성
DROP VIEW IF EXISTS manager_patient_stats;

CREATE VIEW manager_patient_stats AS
SELECT 
  p.id AS manager_id,
  p.name AS manager_name,
  p.email AS manager_email,
  ur.branch,
  COUNT(DISTINCT pat.id) AS total_patients,
  COUNT(DISTINCT 
    CASE 
      WHEN pat.created_at >= date_trunc('month', CURRENT_DATE::timestamp with time zone) 
      THEN pat.id 
      ELSE NULL 
    END
  ) AS new_patients_this_month,
  COUNT(DISTINCT 
    CASE 
      WHEN pat.first_visit_date >= date_trunc('week', CURRENT_DATE::timestamp with time zone) 
      THEN pat.id 
      ELSE NULL 
    END
  ) AS visits_this_week,
  COALESCE(SUM(pkg.patient_payment), 0) AS total_revenue,
  COALESCE(SUM(pkg.outstanding_balance), 0) AS outstanding_balance,
  MAX(pat.created_at) AS last_patient_added
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN patients pat ON pat.assigned_manager = p.id AND pat.branch = ur.branch
LEFT JOIN packages pkg ON pkg.patient_id = pat.id
WHERE ur.role = 'manager' AND ur.approval_status = 'approved'
GROUP BY p.id, p.name, p.email, ur.branch;

-- manager_patient_stats 뷰에 security_invoker 설정
ALTER VIEW manager_patient_stats SET (security_invoker = on);