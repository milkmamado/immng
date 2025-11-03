-- Insert relationships for naseyiyam@gmail.com to supervise the two managers
INSERT INTO public.manager_supervisors (supervisor_id, manager_id, created_by)
SELECT 
  u1.id as supervisor_id,
  u2.id as manager_id,
  u1.id as created_by
FROM auth.users u1
CROSS JOIN auth.users u2
WHERE u1.email = 'naseyiyam@gmail.com'
  AND u2.email IN ('notgul8778@gmail.com', 'rocband79@gmail.com')
ON CONFLICT (supervisor_id, manager_id) DO NOTHING;