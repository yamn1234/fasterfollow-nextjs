
-- Add coupon_type column to distinguish between discount and balance coupons
ALTER TABLE public.coupons 
ADD COLUMN coupon_type text NOT NULL DEFAULT 'discount';

-- Add balance_amount column for balance coupons
ALTER TABLE public.coupons 
ADD COLUMN balance_amount numeric DEFAULT 0;

-- Add description column for admin notes
ALTER TABLE public.coupons 
ADD COLUMN description text;

-- Create coupon_usage table to track who used which coupon
CREATE TABLE public.coupon_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  amount numeric NOT NULL DEFAULT 0
);

-- Enable RLS on coupon_usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own coupon usage
CREATE POLICY "Users can view their own coupon usage"
ON public.coupon_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own coupon usage
CREATE POLICY "Users can insert coupon usage"
ON public.coupon_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all coupon usage
CREATE POLICY "Admins can manage coupon usage"
ON public.coupon_usage
FOR ALL
USING (is_admin(auth.uid()));

-- Update coupons RLS to allow users to view active coupons (for redemption)
CREATE POLICY "Users can view active coupons for redemption"
ON public.coupons
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
