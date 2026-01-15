-- Create salvation_images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('salvation_images', 'salvation_images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read images
CREATE POLICY "Public read access for salvation_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'salvation_images');

-- Allow authenticated uploads (service role will handle this)
CREATE POLICY "Service role upload for salvation_images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'salvation_images');

-- Allow updates
CREATE POLICY "Service role update for salvation_images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'salvation_images');

-- Allow deletes
CREATE POLICY "Service role delete for salvation_images"
ON storage.objects FOR DELETE
USING (bucket_id = 'salvation_images');
