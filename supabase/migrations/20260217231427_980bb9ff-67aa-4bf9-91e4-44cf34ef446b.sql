
-- Add price_type and suggested price range to services table
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS suggested_price_min numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suggested_price_max numeric DEFAULT NULL;

COMMENT ON COLUMN public.services.price_type IS 'fixed | quote';
COMMENT ON COLUMN public.services.suggested_price_min IS 'Min suggested price for quote-type services';
COMMENT ON COLUMN public.services.suggested_price_max IS 'Max suggested price for quote-type services';
