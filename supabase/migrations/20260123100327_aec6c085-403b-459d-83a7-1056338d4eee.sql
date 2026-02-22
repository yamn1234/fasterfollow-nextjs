-- Add 2FA columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret text,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes text[];

-- Create 2FA verification codes table
CREATE TABLE IF NOT EXISTS public.two_factor_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_user_id ON public.two_factor_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_email ON public.two_factor_codes(email);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_expires_at ON public.two_factor_codes(expires_at);

-- Enable RLS
ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;

-- Deny all direct access - only service role can access
CREATE POLICY "Deny all access to two_factor_codes" ON public.two_factor_codes
  AS RESTRICTIVE FOR ALL
  USING (false)
  WITH CHECK (false);

-- Function to cleanup expired 2FA codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_two_factor_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.two_factor_codes
  WHERE expires_at < now() OR used = true;
END;
$$;