
-- Add payment reference columns to wallet_transactions
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS entity_code text,
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'manual';

-- Add constraint for status values
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_status_check
  CHECK (status IN ('pending', 'completed', 'failed'));

-- Add constraint for payment_type values  
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_payment_type_check
  CHECK (payment_type IN ('manual', 'referencia'));

-- Create index for pending transactions lookup (admin panel)
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status 
  ON public.wallet_transactions(status);

-- Create index for reference number lookup
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference 
  ON public.wallet_transactions(reference_number) 
  WHERE reference_number IS NOT NULL;
