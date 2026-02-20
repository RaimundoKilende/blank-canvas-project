
-- Add admin_discount column to service_requests for admin-applied discounts
ALTER TABLE public.service_requests 
  ADD COLUMN IF NOT EXISTS admin_discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_discount_reason text;

-- Add suspension fields to technicians
ALTER TABLE public.technicians 
  ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Add update policy for technician disputes (allow technician to respond)
CREATE POLICY "Technicians can respond to disputes against them" 
ON public.support_tickets 
FOR UPDATE 
USING (auth.uid() = against_id AND status = 'awaiting_response')
WITH CHECK (auth.uid() = against_id AND status = 'under_review');
