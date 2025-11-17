-- Create storage bucket for detection images
INSERT INTO storage.buckets (id, name, public)
VALUES ('detection-images', 'detection-images', true);

-- Create RLS policy to allow anyone to upload detection images
CREATE POLICY "Anyone can upload detection images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'detection-images');

-- Create RLS policy to allow anyone to view detection images
CREATE POLICY "Anyone can view detection images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'detection-images');