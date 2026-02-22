-- Create bonus settings table for controlling deposit bonuses
CREATE TABLE public.bonus_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_amount NUMERIC NOT NULL DEFAULT 0,
  bonus_percentage NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bonus_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active bonus settings
CREATE POLICY "Anyone can read active bonus settings" 
ON public.bonus_settings 
FOR SELECT 
USING (true);

-- Only admins can manage bonus settings
CREATE POLICY "Admins can manage bonus settings" 
ON public.bonus_settings 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_bonus_settings_updated_at
BEFORE UPDATE ON public.bonus_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default bonus rates
INSERT INTO public.bonus_settings (min_amount, bonus_percentage, sort_order) VALUES
(10, 5, 1),
(25, 10, 2),
(50, 15, 3),
(100, 20, 4);

-- Create global setting for bonus visibility
INSERT INTO public.site_settings (key, value, group_name) VALUES
('bonus_enabled', 'true', 'payments')
ON CONFLICT (key) DO NOTHING;