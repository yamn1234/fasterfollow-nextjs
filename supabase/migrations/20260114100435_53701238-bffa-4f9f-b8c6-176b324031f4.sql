-- Add suspension columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_suspended boolean NOT NULL DEFAULT false,
ADD COLUMN suspended_at timestamp with time zone,
ADD COLUMN suspension_reason text;