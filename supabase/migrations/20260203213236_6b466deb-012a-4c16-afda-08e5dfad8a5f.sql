-- Create storage bucket for service request photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Users can upload service photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-photos');

-- Allow public read access to service photos
CREATE POLICY "Public can view service photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'service-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own service photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'service-photos' AND auth.uid()::text = (storage.foldername(name))[1]);