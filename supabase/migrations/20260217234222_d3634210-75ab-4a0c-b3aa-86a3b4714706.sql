
-- Platform settings table for admin-configurable values
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON public.platform_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can view settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Insert default cancellation fee
INSERT INTO public.platform_settings (key, value, description)
VALUES ('cancellation_fee', '2000', 'Taxa de cancelamento (Kz) quando o técnico já chegou ao local');

-- Support tickets table for disputes
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reporter_role text NOT NULL,
  against_id uuid,
  service_request_id uuid REFERENCES public.service_requests(id),
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  resolution text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id OR auth.uid() = against_id);

CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Add cancellation_fee_applied to service_requests
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS cancellation_fee numeric DEFAULT 0;

-- Trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
