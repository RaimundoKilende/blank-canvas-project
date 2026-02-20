-- Add RLS policy to allow technicians to cancel their accepted services
CREATE POLICY "Technicians can cancel their accepted requests" 
ON public.service_requests 
FOR UPDATE 
USING (
  auth.uid() = technician_id 
  AND status IN ('accepted', 'in_progress')
)
WITH CHECK (
  auth.uid() = technician_id 
  AND status = 'cancelled'
);