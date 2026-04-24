-- Migration v9: Add first_connection flag to profiles
-- Run this in the Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_connection BOOLEAN DEFAULT TRUE;

-- Existing users should NOT see the tutorial
UPDATE profiles SET first_connection = FALSE WHERE first_connection IS NULL OR first_connection = TRUE;

-- New profiles created after this migration will default to TRUE
