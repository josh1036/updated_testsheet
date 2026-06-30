-- RLS policies for Company Logos bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Company Logos');

CREATE POLICY IF NOT EXISTS "Public can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Company Logos');

CREATE POLICY IF NOT EXISTS "Users can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'Company Logos');

CREATE POLICY IF NOT EXISTS "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'Company Logos');
