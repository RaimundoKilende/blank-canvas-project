-- Add policy to allow clients to cancel their pending or accepted requests
DROP POLICY IF EXISTS "Clients can cancel their pending requests" ON public.service_requests;

CREATE POLICY "Clients can cancel their pending requests" 
ON public.service_requests 
FOR UPDATE 
USING (
  auth.uid() = client_id 
  AND status IN ('pending', 'accepted')
)
WITH CHECK (
  auth.uid() = client_id 
  AND status = 'cancelled'
);