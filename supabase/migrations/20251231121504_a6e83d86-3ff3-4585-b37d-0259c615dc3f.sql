-- Add image columns to service_categories table
ALTER TABLE public.service_categories 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS description text;

-- Add description_ar column if not exists (was missing from categories)
ALTER TABLE public.service_categories 
ADD COLUMN IF NOT EXISTS description_ar text;