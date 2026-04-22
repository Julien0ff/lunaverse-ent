-- Migration: Casino Streaks and Money Declarations
-- Added to track dirty money and risk-based gambling

-- Update PROFILES table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dirty_balance DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS casino_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_accumulated_winnings DECIMAL DEFAULT 0;

-- Create DECLARATIONS table
CREATE TABLE IF NOT EXISTS declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    source VARCHAR NOT NULL, -- e.g., 'casino'
    reason TEXT,
    status VARCHAR DEFAULT 'pending', -- 'pending', 'accepted', 'refused'
    has_penalty BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_declarations_user_id ON declarations(user_id);
CREATE INDEX IF NOT EXISTS idx_declarations_status ON declarations(status);
