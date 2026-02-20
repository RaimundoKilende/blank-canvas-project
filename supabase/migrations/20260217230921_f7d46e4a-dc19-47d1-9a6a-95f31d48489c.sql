
-- Allow clients to approve/reject quotes on their accepted service requests
CREATE POLICY "Clients can respond to quotes"
ON public.service_requests
FOR UPDATE
USING (
  auth.uid() = client_id 
  AND status = 'accepted' 
  AND quote_status = 'sent'
)
WITH CHECK (
  auth.uid() = client_id 
  AND status = 'accepted' 
  AND quote_status IN ('approved', 'rejected')
);
