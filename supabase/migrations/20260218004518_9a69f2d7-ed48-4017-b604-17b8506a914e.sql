
-- Add scheduling fields to service_requests
ALTER TABLE public.service_requests
ADD COLUMN scheduling_type text NOT NULL DEFAULT 'now',
ADD COLUMN scheduled_date date NULL,
ADD COLUMN scheduled_time time NULL;
