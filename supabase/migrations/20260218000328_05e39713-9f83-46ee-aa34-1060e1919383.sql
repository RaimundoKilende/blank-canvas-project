
-- Add dispute-specific columns to support_tickets
ALTER TABLE public.support_tickets 
  ADD COLUMN IF NOT EXISTS ticket_type text NOT NULL DEFAULT 'support',
  ADD COLUMN IF NOT EXISTS evidence_photos text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS technician_response text,
  ADD COLUMN IF NOT EXISTS response_deadline timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verdict text,
  ADD COLUMN IF NOT EXISTS verdict_notes text;

-- Create storage bucket for dispute evidence
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dispute-evidence', 'dispute-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for dispute evidence
CREATE POLICY "Authenticated users can upload dispute evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dispute-evidence');

CREATE POLICY "Anyone can view dispute evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'dispute-evidence');

CREATE POLICY "Users can delete their own dispute evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dispute-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);
