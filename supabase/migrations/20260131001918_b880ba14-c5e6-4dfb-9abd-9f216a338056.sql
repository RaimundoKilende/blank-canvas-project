-- Add client_type column to profiles table for Personal/Company/Institution/Organization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'personal' 
CHECK (client_type IN ('personal', 'company', 'institution', 'organization'));

-- Add credits column to technicians table for the loyalty system
ALTER TABLE public.technicians 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Create trigger function to award credits on 4+ star ratings
CREATE OR REPLACE FUNCTION public.award_technician_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 1 credit for ratings above 4 stars
  IF NEW.rating >= 4 AND (OLD.rating IS NULL OR OLD.rating < 4) THEN
    UPDATE public.technicians 
    SET credits = credits + 1
    WHERE user_id = (
      SELECT technician_id FROM public.service_requests WHERE id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for credit awards
DROP TRIGGER IF EXISTS award_credits_on_rating ON public.service_requests;
CREATE TRIGGER award_credits_on_rating
AFTER UPDATE OF rating ON public.service_requests
FOR EACH ROW
WHEN (NEW.rating IS NOT NULL)
EXECUTE FUNCTION public.award_technician_credits();

-- Add unresponded_alert column to track admin alerts for unanswered requests
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS unresponded_alert_sent BOOLEAN DEFAULT false;