
-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Public can view active technicians" ON public.technicians;

-- Create a new policy that doesn't require wallet_balance > 0
CREATE POLICY "Public can view active technicians"
ON public.technicians
FOR SELECT
USING ((active = true) AND (verified = true));

-- Also fix admin user_roles entry
INSERT INTO public.user_roles (user_id, role)
VALUES ('934af86d-f13a-4698-b0eb-584d903054e2', 'admin')
ON CONFLICT DO NOTHING;
