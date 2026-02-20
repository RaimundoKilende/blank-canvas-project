-- Add completion_photos column for technician work documentation
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS completion_photos text[] DEFAULT NULL;

-- Add audio_url column for client voice descriptions
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS audio_url text DEFAULT NULL;

-- Update storage policies to allow technicians to upload completion photos
CREATE POLICY "Technicians can upload completion photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-photos' AND
  auth.role() = 'authenticated'
);

-- Allow technicians to delete their uploaded photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create audio bucket for voice descriptions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-audio', 'service-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload audio
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-audio' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to audio
CREATE POLICY "Anyone can read audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-audio');