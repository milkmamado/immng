-- Update handle_new_user function to use branch from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_branch branch_type;
BEGIN
  -- Get branch from user metadata, default to '광명' if not provided
  user_branch := COALESCE(NEW.raw_user_meta_data ->> 'branch', '광명')::branch_type;
  
  -- Create profile with branch
  INSERT INTO public.profiles (id, name, email, branch)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    user_branch
  );
  
  -- Create user_role with pending status and branch
  INSERT INTO public.user_roles (user_id, role, approval_status, branch)
  VALUES (NEW.id, 'manager', 'pending', user_branch);
  
  RETURN NEW;
END;
$function$;