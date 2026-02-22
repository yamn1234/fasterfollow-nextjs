-- Add redirect_url column to payment_gateways for manual payment methods
ALTER TABLE public.payment_gateways 
ADD COLUMN IF NOT EXISTS redirect_url text,
ADD COLUMN IF NOT EXISTS instructions text,
ADD COLUMN IF NOT EXISTS instructions_ar text,
ADD COLUMN IF NOT EXISTS gateway_type text DEFAULT 'automatic';