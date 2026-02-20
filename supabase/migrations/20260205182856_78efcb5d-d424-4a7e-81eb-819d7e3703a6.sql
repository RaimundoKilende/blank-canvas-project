-- Add commission_percentage column to services table
ALTER TABLE public.services 
ADD COLUMN commission_percentage numeric NOT NULL DEFAULT 10;

-- Add a comment explaining the column
COMMENT ON COLUMN public.services.commission_percentage IS 'Platform commission percentage for this service (default 10%)';