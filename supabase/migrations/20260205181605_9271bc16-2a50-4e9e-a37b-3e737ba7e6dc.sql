-- Drop the restrictive policy that prevents rejected technicians from seeing their own profile
DROP POLICY IF EXISTS "Technicians can view their own profile" ON public.technicians;

-- Create new policy that allows technicians to ALWAYS view their own profile (including rejected ones)
CREATE POLICY "Technicians can view their own profile" 
ON public.technicians 
FOR SELECT 
USING (auth.uid() = user_id);