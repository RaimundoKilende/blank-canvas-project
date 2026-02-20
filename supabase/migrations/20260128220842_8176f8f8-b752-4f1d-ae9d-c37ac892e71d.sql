-- =============================================
-- TABELA DE SERVIÇOS (antes era category, agora service tem os detalhes)
-- =============================================
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'wrench',
  base_price NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS policies for services
CREATE POLICY "Anyone can view active services" ON public.services
FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage services" ON public.services
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- =============================================
-- TABELA DE ESPECIALIDADES
-- =============================================
CREATE TABLE public.specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

-- RLS policies for specialties
CREATE POLICY "Anyone can view active specialties" ON public.specialties
FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage specialties" ON public.specialties
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- =============================================
-- TABELA DE TRANSAÇÕES FINANCEIRAS
-- =============================================
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  technician_id UUID,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'commission')),
  category TEXT NOT NULL DEFAULT 'service',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all transactions" ON public.financial_transactions
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Technicians can view their transactions" ON public.financial_transactions
FOR SELECT USING (technician_id = auth.uid());

-- =============================================
-- CORRIGIR POLÍTICA RLS PARA TÉCNICOS ACEITAREM SOLICITAÇÕES
-- O problema é que a política atual só permite atualizar se technician_id já é o usuário
-- Mas quando aceita, o technician_id é NULL, então precisa permitir aceitar pending requests
-- =============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Technicians can update assigned requests" ON public.service_requests;

-- Create new policy that allows:
-- 1. Technicians to accept pending requests (technician_id is NULL, status is pending)
-- 2. Technicians to update their own assigned requests
CREATE POLICY "Technicians can accept pending requests" ON public.service_requests
FOR UPDATE USING (
  -- Can accept pending requests (technician_id is NULL)
  (status = 'pending'::service_status AND technician_id IS NULL)
  OR
  -- Can update their own assigned requests
  (auth.uid() = technician_id)
);

-- =============================================
-- TRIGGER para registrar transações automaticamente quando serviço é concluído
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_service_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger on completion
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Register income
    INSERT INTO public.financial_transactions (
      service_request_id,
      technician_id,
      type,
      category,
      description,
      amount,
      date
    ) VALUES (
      NEW.id,
      NEW.technician_id,
      'income',
      'service',
      'Serviço concluído',
      NEW.total_price,
      CURRENT_DATE
    );
    
    -- Register commission (10% platform fee)
    INSERT INTO public.financial_transactions (
      service_request_id,
      technician_id,
      type,
      category,
      description,
      amount,
      date
    ) VALUES (
      NEW.id,
      NEW.technician_id,
      'commission',
      'platform_fee',
      'Comissão da plataforma (10%)',
      NEW.total_price * 0.10,
      CURRENT_DATE
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_service_completed ON public.service_requests;
CREATE TRIGGER on_service_completed
AFTER UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_service_completed();

-- =============================================
-- Adicionar realtime às novas tabelas
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.specialties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;

-- =============================================
-- Políticas adicionais para Admins gerenciarem perfis
-- =============================================

-- Permitir que admins deletem profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE USING (has_role(auth.uid(), 'admin'::user_role));

-- Permitir que admins atualizem qualquer profile
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (has_role(auth.uid(), 'admin'::user_role));

-- Permitir que admins deletem technicians
CREATE POLICY "Admins can delete technicians" ON public.technicians
FOR DELETE USING (has_role(auth.uid(), 'admin'::user_role));