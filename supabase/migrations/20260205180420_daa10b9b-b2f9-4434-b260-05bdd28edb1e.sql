-- Add rejected column to technicians table
ALTER TABLE public.technicians 
ADD COLUMN IF NOT EXISTS rejected boolean DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_technicians_rejected ON public.technicians(rejected);