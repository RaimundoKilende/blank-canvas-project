-- Create storage bucket for technician documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('technician-documents', 'technician-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Technicians can upload their own documents
CREATE POLICY "Technicians can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'technician-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Technicians can view their own documents
CREATE POLICY "Technicians can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'technician-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Admins can view all documents
CREATE POLICY "Admins can view all technician documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'technician-documents' 
  AND has_role(auth.uid(), 'admin')
);

-- Storage policy: Technicians can delete their own documents
CREATE POLICY "Technicians can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'technician-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);