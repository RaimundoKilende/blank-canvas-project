
-- 1. Make vendor_categories admin-managed (global categories)
-- Make vendor_id nullable so admin can create global categories
ALTER TABLE public.vendor_categories ALTER COLUMN vendor_id DROP NOT NULL;

-- Drop existing vendor-specific RLS policies
DROP POLICY IF EXISTS "Vendors can manage their own categories" ON public.vendor_categories;

-- Add admin-only write policies
CREATE POLICY "Admins can insert vendor categories"
ON public.vendor_categories FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vendor categories"
ON public.vendor_categories FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vendor categories"
ON public.vendor_categories FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add portfolio_photos column to technicians
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS portfolio_photos text[] DEFAULT '{}'::text[];

-- 3. Create storage bucket for technician portfolio
INSERT INTO storage.buckets (id, name, public) VALUES ('technician-portfolio', 'technician-portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Portfolio storage policies
CREATE POLICY "Anyone can view portfolio photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'technician-portfolio');

CREATE POLICY "Technicians can upload portfolio photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'technician-portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Technicians can delete portfolio photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'technician-portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
