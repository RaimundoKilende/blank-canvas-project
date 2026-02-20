-- Add interview data columns to technicians table
ALTER TABLE public.technicians
ADD COLUMN IF NOT EXISTS years_experience text,
ADD COLUMN IF NOT EXISTS availability text,
ADD COLUMN IF NOT EXISTS work_areas text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS has_own_tools boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_transport boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS certifications text,
ADD COLUMN IF NOT EXISTS motivation text,
ADD COLUMN IF NOT EXISTS previous_experience text;

-- Add comment for documentation
COMMENT ON COLUMN public.technicians.years_experience IS 'Years of experience selected during registration';
COMMENT ON COLUMN public.technicians.availability IS 'Work availability (full-time, part-time, weekends, flexible)';
COMMENT ON COLUMN public.technicians.work_areas IS 'Array of work areas/regions';
COMMENT ON COLUMN public.technicians.has_own_tools IS 'Whether technician has own tools';
COMMENT ON COLUMN public.technicians.has_transport IS 'Whether technician has own transport';
COMMENT ON COLUMN public.technicians.certifications IS 'Professional certifications';
COMMENT ON COLUMN public.technicians.motivation IS 'Motivation text from interview';
COMMENT ON COLUMN public.technicians.previous_experience IS 'Previous work experience description';