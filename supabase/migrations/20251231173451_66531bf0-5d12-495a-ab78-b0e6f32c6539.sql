-- Create storage bucket for service and category images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-images', 'service-images', true);

-- Allow anyone to view images (public bucket)
CREATE POLICY "Public can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- Allow authenticated admins to upload images
CREATE POLICY "Admins can upload service images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-images' 
  AND public.is_admin(auth.uid())
);

-- Allow authenticated admins to update images
CREATE POLICY "Admins can update service images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-images' 
  AND public.is_admin(auth.uid())
);

-- Allow authenticated admins to delete images
CREATE POLICY "Admins can delete service images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-images' 
  AND public.is_admin(auth.uid())
);