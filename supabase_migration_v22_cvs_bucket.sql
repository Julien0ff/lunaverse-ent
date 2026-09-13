-- Create 'cvs' bucket for recruitment applications
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- Optionally, drop existing policies if you run this multiple times
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;

-- Policy to allow public read access (so admins can see the CVs)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'cvs');

-- Policy to allow public uploads (since recruitment page can be used by non-authenticated or partially authenticated users)
-- In a strict setup, you might restrict this, but for the recruitment page, anyone can upload a CV.
CREATE POLICY "Allow uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'cvs');
