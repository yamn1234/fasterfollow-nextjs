-- Add requires_comments field to services table
ALTER TABLE public.services 
ADD COLUMN requires_comments boolean DEFAULT false;

-- Add comments field to orders table
ALTER TABLE public.orders 
ADD COLUMN comments text;