-- manager_name이 없는 환자들에게 profiles에서 이름을 가져와서 할당
UPDATE public.patients
SET manager_name = profiles.name
FROM public.profiles
WHERE patients.assigned_manager = profiles.id
  AND patients.manager_name IS NULL;