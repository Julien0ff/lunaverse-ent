-- Migration v26: Add reschedule_requests JSONB column to interviews table
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS reschedule_requests JSONB DEFAULT '[]'::jsonb;
