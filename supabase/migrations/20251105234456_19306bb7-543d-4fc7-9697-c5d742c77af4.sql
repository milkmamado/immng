-- pending_approvals 뷰에 RLS 정책 추가
ALTER VIEW pending_approvals SET (security_invoker = on);

-- approved_users 뷰에 RLS 정책 추가
ALTER VIEW approved_users SET (security_invoker = on);