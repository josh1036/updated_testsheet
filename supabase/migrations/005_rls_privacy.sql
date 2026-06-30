-- Enable RLS on test_records
ALTER TABLE test_records ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if any
DROP POLICY IF EXISTS "Users can view all records" ON test_records;
DROP POLICY IF EXISTS "Enable read access for all users" ON test_records;

-- Users can only see their own records
CREATE POLICY IF NOT EXISTS "Users can view own records"
ON test_records FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert their own records
CREATE POLICY IF NOT EXISTS "Users can insert own records"
ON test_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own records
CREATE POLICY IF NOT EXISTS "Users can update own records"
ON test_records FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can only delete their own records
CREATE POLICY IF NOT EXISTS "Users can delete own records"
ON test_records FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Public share token access (no user_id check)
CREATE POLICY IF NOT EXISTS "Public share token access"
ON test_records FOR SELECT
TO anon
USING (share_token IS NOT NULL);
