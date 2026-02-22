-- Create reviews table for service ratings
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id) -- One review per order
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (is_approved = true);

-- Users can view their own reviews
CREATE POLICY "Users can view their own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create reviews for their completed orders
CREATE POLICY "Users can create reviews for their orders"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id 
    AND orders.user_id = auth.uid()
    AND orders.status = 'completed'
  )
);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.reviews
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add average_rating and reviews_count to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_time TEXT DEFAULT 'فوري - 24 ساعة';

-- Create function to update service rating stats
CREATE OR REPLACE FUNCTION public.update_service_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update on INSERT or UPDATE when approved
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_approved = true THEN
    UPDATE public.services
    SET 
      average_rating = (
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM public.reviews
        WHERE service_id = NEW.service_id AND is_approved = true
      ),
      reviews_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE service_id = NEW.service_id AND is_approved = true
      )
    WHERE id = NEW.service_id;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    UPDATE public.services
    SET 
      average_rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM public.reviews
        WHERE service_id = OLD.service_id AND is_approved = true
      ), 0),
      reviews_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE service_id = OLD.service_id AND is_approved = true
      )
    WHERE id = OLD.service_id;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-updating service stats
CREATE TRIGGER update_service_stats_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_rating_stats();