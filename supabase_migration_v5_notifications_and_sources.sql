-- Migration: Notifications & Dirty Money Sources

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'money'
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Dirty Money Sources Table
CREATE TABLE IF NOT EXISTS dirty_money_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  source TEXT NOT NULL, -- e.g., 'Casino'
  details TEXT, -- e.g., 'Machines à sous - 19/04 15:40'
  declared BOOLEAN DEFAULT false,
  declaration_id UUID REFERENCES declarations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Add rp_name to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rp_name') THEN
        ALTER TABLE profiles ADD COLUMN rp_name TEXT;
    END IF;
END $$;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_dirty_money_sources_user_id ON dirty_money_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_dirty_money_sources_declared ON dirty_money_sources(declared);
