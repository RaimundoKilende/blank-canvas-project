
-- Add wallet, documents and interview fields to vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS wallet_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documents text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS motivation text,
  ADD COLUMN IF NOT EXISTS years_experience text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS work_areas text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS certifications text,
  ADD COLUMN IF NOT EXISTS previous_experience text;

-- Add wallet, documents and interview fields to delivery_persons
ALTER TABLE public.delivery_persons
  ADD COLUMN IF NOT EXISTS wallet_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documents text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS motivation text,
  ADD COLUMN IF NOT EXISTS years_experience text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS work_areas text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS certifications text,
  ADD COLUMN IF NOT EXISTS previous_experience text,
  ADD COLUMN IF NOT EXISTS license_number text;

-- Make wallet_transactions support vendors and delivery persons
ALTER TABLE public.wallet_transactions
  ALTER COLUMN technician_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS vendor_id uuid,
  ADD COLUMN IF NOT EXISTS delivery_person_id uuid;

-- Add RLS policies for vendor wallet transactions
CREATE POLICY "Vendors can view their wallet transactions"
ON public.wallet_transactions
FOR SELECT
USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Delivery persons can view their wallet transactions"
ON public.wallet_transactions
FOR SELECT
USING (delivery_person_id IN (SELECT id FROM delivery_persons WHERE user_id = auth.uid()));

-- Storage bucket for vendor documents
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-documents', 'vendor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for delivery documents
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-documents', 'delivery-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vendor documents
CREATE POLICY "Vendors can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vendors can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view vendor documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-documents' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for delivery documents
CREATE POLICY "Delivery persons can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'delivery-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Delivery persons can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'delivery-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view delivery documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'delivery-documents' AND public.has_role(auth.uid(), 'admin'));
