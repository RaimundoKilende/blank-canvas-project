-- Add category_id to specialties table (link to category instead of service)
ALTER TABLE public.specialties ADD COLUMN category_id uuid REFERENCES public.service_categories(id);

-- Update existing specialties to link to category through their service (if any exist)
UPDATE public.specialties s
SET category_id = srv.category_id
FROM public.services srv
WHERE s.service_id = srv.id;

-- Make service_id nullable since we now link to category
ALTER TABLE public.specialties ALTER COLUMN service_id DROP NOT NULL;

-- Add INSERT policy for notifications (allow system to create notifications)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Add DELETE policy for notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);