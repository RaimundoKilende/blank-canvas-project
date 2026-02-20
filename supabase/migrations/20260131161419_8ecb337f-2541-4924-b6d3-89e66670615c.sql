-- Update handle_new_user function to include organization fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, phone, role, client_type, company_name, nif, organization_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client') = 'client' 
      THEN COALESCE(NEW.raw_user_meta_data->>'client_type', 'personal')
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'nif',
    NEW.raw_user_meta_data->>'organization_type'
  );
  
  -- Add user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  
  -- Create technician profile if role is technician
  IF COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client') = 'technician' THEN
    INSERT INTO public.technicians (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;