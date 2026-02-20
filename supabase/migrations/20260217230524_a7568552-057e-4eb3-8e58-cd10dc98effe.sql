
-- Add quote/budget fields to service_requests for complex services
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS quote_amount numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quote_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quote_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quote_sent_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quote_approved_at timestamp with time zone DEFAULT NULL;

-- quote_status values: 'sent', 'approved', 'rejected'
COMMENT ON COLUMN public.service_requests.quote_status IS 'sent | approved | rejected';
