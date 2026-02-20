
-- Add wallet_balance to technicians table
ALTER TABLE public.technicians 
ADD COLUMN wallet_balance numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.technicians.wallet_balance IS 'Saldo da carteira digital do técnico em Kz';

-- Create wallet_transactions table to track deposits and commission deductions
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'commission_deduction')),
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  description text NOT NULL,
  service_request_id uuid REFERENCES public.service_requests(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Technicians can view their own wallet transactions
CREATE POLICY "Technicians can view their wallet transactions"
ON public.wallet_transactions
FOR SELECT
USING (
  technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
);

-- Admins can manage all wallet transactions
CREATE POLICY "Admins can manage wallet transactions"
ON public.wallet_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- System can insert wallet transactions (for triggers)
CREATE POLICY "System can insert wallet transactions"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (true);

-- Enable realtime for wallet_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- Update handle_service_completed to use service commission_percentage and deduct from wallet
CREATE OR REPLACE FUNCTION public.handle_service_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_commission_pct numeric;
  v_commission_amount numeric;
  v_technician_record RECORD;
  v_new_balance numeric;
BEGIN
  -- Only trigger on completion
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Get commission percentage from the service's category
    -- First try to find a service linked to this category
    SELECT COALESCE(s.commission_percentage, 10) INTO v_commission_pct
    FROM public.services s
    WHERE s.category_id = NEW.category_id
    LIMIT 1;
    
    -- Default to 10% if no service found
    IF v_commission_pct IS NULL THEN
      v_commission_pct := 10;
    END IF;
    
    v_commission_amount := NEW.total_price * (v_commission_pct / 100.0);
    
    -- Register income transaction
    INSERT INTO public.financial_transactions (
      service_request_id, technician_id, type, category, description, amount, date
    ) VALUES (
      NEW.id, NEW.technician_id, 'income', 'service',
      'Serviço concluído', NEW.total_price, CURRENT_DATE
    );
    
    -- Register commission transaction
    INSERT INTO public.financial_transactions (
      service_request_id, technician_id, type, category, description, amount, date
    ) VALUES (
      NEW.id, NEW.technician_id, 'commission', 'platform_fee',
      format('Comissão da plataforma (%s%%)', v_commission_pct),
      v_commission_amount, CURRENT_DATE
    );
    
    -- Deduct commission from technician wallet
    IF NEW.technician_id IS NOT NULL THEN
      SELECT * INTO v_technician_record 
      FROM public.technicians WHERE user_id = NEW.technician_id;
      
      IF FOUND THEN
        v_new_balance := GREATEST(v_technician_record.wallet_balance - v_commission_amount, 0);
        
        UPDATE public.technicians 
        SET wallet_balance = v_new_balance
        WHERE id = v_technician_record.id;
        
        -- Record wallet transaction
        INSERT INTO public.wallet_transactions (
          technician_id, type, amount, balance_after, description, service_request_id
        ) VALUES (
          v_technician_record.id, 'commission_deduction', v_commission_amount,
          v_new_balance, format('Comissão %s%% - Serviço concluído', v_commission_pct),
          NEW.id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
