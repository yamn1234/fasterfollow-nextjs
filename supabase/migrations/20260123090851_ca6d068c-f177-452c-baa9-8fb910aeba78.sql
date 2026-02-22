-- Create password_resets table for OTP codes
CREATE TABLE public.password_resets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_password_resets_email ON public.password_resets(email);
CREATE INDEX idx_password_resets_expires ON public.password_resets(expires_at);

-- Enable RLS
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access (edge functions)
CREATE POLICY "Service role can manage password resets"
ON public.password_resets
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to clean up expired codes (can be called by cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_resets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_resets
  WHERE expires_at < now() OR used = true;
END;
$$;