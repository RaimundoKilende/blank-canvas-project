-- Add policy to allow clients to rate their completed services
CREATE POLICY "Clients can rate their completed services" 
ON public.service_requests 
FOR UPDATE 
USING (
  auth.uid() = client_id 
  AND status = 'completed'::service_status
  AND rating IS NULL
)
WITH CHECK (
  auth.uid() = client_id 
  AND status = 'completed'::service_status
);