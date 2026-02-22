-- Fix RLS policy to be more restrictive - only service role can access
DROP POLICY IF EXISTS "Service role can manage password resets" ON public.password_resets;

-- Create restrictive policy - deny all access by default (only service role bypasses RLS)
CREATE POLICY "Deny all access to password_resets"
ON public.password_resets
FOR ALL
USING (false)
WITH CHECK (false);