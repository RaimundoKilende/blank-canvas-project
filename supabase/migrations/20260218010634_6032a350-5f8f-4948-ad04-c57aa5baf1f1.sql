-- Update RLS policy for technicians: hide from public when wallet_balance <= 0
DROP POLICY IF EXISTS "Public can view active technicians" ON public.technicians;
CREATE POLICY "Public can view active technicians"
ON public.technicians
FOR SELECT
USING ((active = true) AND (verified = true) AND (wallet_balance > 0));

-- Update RLS policy for vendors: hide from public when wallet_balance <= 0
DROP POLICY IF EXISTS "Public can view active vendors" ON public.vendors;
CREATE POLICY "Public can view active vendors"
ON public.vendors
FOR SELECT
USING ((active = true) AND (verified = true) AND (wallet_balance > 0));

-- Update RLS policy for delivery_persons: hide from public when wallet_balance <= 0
DROP POLICY IF EXISTS "Public can view active delivery persons" ON public.delivery_persons;
CREATE POLICY "Public can view active delivery persons"
ON public.delivery_persons
FOR SELECT
USING ((active = true) AND (verified = true) AND (wallet_balance > 0));