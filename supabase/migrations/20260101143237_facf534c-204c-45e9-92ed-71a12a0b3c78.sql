-- Add icon and image_url columns to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url text;