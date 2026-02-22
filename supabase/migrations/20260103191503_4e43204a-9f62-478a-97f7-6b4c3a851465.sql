-- Add image_url column to payment_gateways table
ALTER TABLE public.payment_gateways 
ADD COLUMN IF NOT EXISTS image_url TEXT;