-- Add last_seen_at to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update social API to use site activity
-- This will be handled in the API logic, but we ensure the column exists.
