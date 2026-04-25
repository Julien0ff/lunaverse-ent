-- Migration V14: House System
-- Supports house requests, ownership, and management

CREATE TABLE IF NOT EXISTS houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    discord_channel_id VARCHAR,
    category_id VARCHAR,
    status VARCHAR DEFAULT 'pending', -- 'pending', 'active', 'rejected'
    whitelist UUID[] DEFAULT '{}', -- Array of profile IDs who can enter
    blacklist UUID[] DEFAULT '{}', -- Array of profile IDs who are banned
    furnishings JSONB DEFAULT '{}', -- Track items like {'fridge': true, 'bed': true}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Houses are viewable by everyone"
ON houses FOR SELECT
USING (true);

CREATE POLICY "Owners can update their own house"
ON houses FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own house requests"
ON houses FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own house requests"
ON houses FOR DELETE
USING (auth.uid() = owner_id);

-- CONFIG TABLE (for bot settings)
CREATE TABLE IF NOT EXISTS server_config (
    key VARCHAR PRIMARY KEY,
    value VARCHAR,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO server_config (key, value) VALUES ('house_request_channel', '') ON CONFLICT DO NOTHING;
