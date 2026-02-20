
-- Fix: Allow delivery persons to accept pending deliveries (update delivery_person_id and status)
CREATE POLICY "Delivery persons can accept pending deliveries"
ON public.deliveries FOR UPDATE
USING (
  (status = 'pending' AND delivery_person_id IS NULL)
)
WITH CHECK (
  (auth.uid() = delivery_person_id AND status = 'accepted')
);

-- Create storage bucket for product photos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for product photos bucket
CREATE POLICY "Anyone can view product photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-photos');

CREATE POLICY "Vendors can upload product photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Vendors can update their product photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Vendors can delete their product photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-photos' AND auth.uid() IS NOT NULL);
