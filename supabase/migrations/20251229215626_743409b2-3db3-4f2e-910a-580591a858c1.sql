-- Create table for API providers
CREATE TABLE public.api_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own providers"
ON public.api_providers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own providers"
ON public.api_providers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own providers"
ON public.api_providers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own providers"
ON public.api_providers
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_api_providers_updated_at
BEFORE UPDATE ON public.api_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();