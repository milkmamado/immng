-- Drop the existing INSERT policy that doesn't work for new users
DROP POLICY IF EXISTS "Users can create their own pending role" ON public.user_roles;

-- Update the handle_new_user trigger to also create user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- Create user_role with pending status
  INSERT INTO public.user_roles (user_id, role, approval_status)
  VALUES (NEW.id, 'manager', 'pending');
  
  RETURN NEW;
END;
$$;