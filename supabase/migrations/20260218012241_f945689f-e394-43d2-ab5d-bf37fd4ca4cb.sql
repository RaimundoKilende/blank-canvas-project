
-- Add completion_code column to service_requests
ALTER TABLE public.service_requests ADD COLUMN completion_code text;

-- Function to generate 4-digit code when service starts
CREATE OR REPLACE FUNCTION public.generate_completion_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    NEW.completion_code := lpad(floor(random() * 10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_completion_code
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.generate_completion_code();

-- Function to validate completion code
CREATE OR REPLACE FUNCTION public.validate_completion_code(request_id uuid, code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code text;
  v_status text;
  v_technician_id uuid;
BEGIN
  SELECT completion_code, status, technician_id INTO v_code, v_status, v_technician_id
  FROM public.service_requests WHERE id = request_id;
  
  IF v_status != 'in_progress' THEN
    RETURN false;
  END IF;
  
  IF v_technician_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  RETURN v_code = code;
END;
$$;

-- Function to check if technician has active service
CREATE OR REPLACE FUNCTION public.technician_has_active_service(tech_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.service_requests
    WHERE technician_id = tech_user_id
    AND status IN ('accepted', 'in_progress')
  );
$$;
