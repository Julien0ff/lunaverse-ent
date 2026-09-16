-- Migration V24: Maison System V2
-- Updates the existing houses system and adds rooms, members, and items tables

-- 1. Modify existing 'houses' table
ALTER TABLE houses DROP COLUMN IF EXISTS name;
ALTER TABLE houses DROP COLUMN IF EXISTS discord_channel_id; -- Replaced by house_rooms
ALTER TABLE houses DROP COLUMN IF EXISTS whitelist; -- Replaced by house_members
ALTER TABLE houses DROP COLUMN IF EXISTS blacklist;
ALTER TABLE houses DROP COLUMN IF EXISTS furnishings; -- Replaced by house_items
ALTER TABLE houses DROP COLUMN IF EXISTS status; -- No more pending status, purchase is instant

-- Add discord_category_id column for storing the created Discord category ID
ALTER TABLE houses ADD COLUMN IF NOT EXISTS discord_category_id VARCHAR;

-- Add sq_meters column for house surface area
ALTER TABLE houses ADD COLUMN IF NOT EXISTS sq_meters INTEGER DEFAULT 0;

-- 2. House Rooms Table
CREATE TABLE IF NOT EXISTS house_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL DEFAULT 'text', -- 'text' or 'voice'
    discord_channel_id VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE house_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "House rooms are viewable by everyone" ON house_rooms FOR SELECT USING (true);
CREATE POLICY "House rooms can be modified by owner" ON house_rooms FOR ALL USING (
    EXISTS (SELECT 1 FROM houses WHERE id = house_id AND owner_id = auth.uid())
);

-- 3. House Members Table (Family / Invitations)
CREATE TABLE IF NOT EXISTS house_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR DEFAULT 'enfant', -- 'parent', 'enfant'
    status VARCHAR DEFAULT 'pending', -- 'pending', 'accepted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(house_id, user_id)
);

ALTER TABLE house_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "House members viewable by everyone" ON house_members FOR SELECT USING (true);
CREATE POLICY "Members can accept/reject their own invitations" ON house_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Members can delete their own membership" ON house_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Owners can manage members" ON house_members FOR ALL USING (
    EXISTS (SELECT 1 FROM houses WHERE id = house_id AND owner_id = auth.uid())
);

-- 4. House Items (Furniture / DLC)
CREATE TABLE IF NOT EXISTS house_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
    item_id VARCHAR NOT NULL, -- references a static catalog or items table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE house_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "House items viewable by everyone" ON house_items FOR SELECT USING (true);
CREATE POLICY "Owners can manage items" ON house_items FOR ALL USING (
    EXISTS (SELECT 1 FROM houses WHERE id = house_id AND owner_id = auth.uid())
);

-- 5. House Storage (For Fridge / Oven RP interactions)
CREATE TABLE IF NOT EXISTS house_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
    container_type VARCHAR NOT NULL, -- 'fridge', 'oven', 'cupboard'
    item_name VARCHAR NOT NULL,
    quantity INTEGER DEFAULT 1,
    stored_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE house_storage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "House storage viewable by members" ON house_storage FOR SELECT USING (
    EXISTS (SELECT 1 FROM house_members WHERE house_id = house_storage.house_id AND user_id = auth.uid() AND status = 'accepted')
    OR EXISTS (SELECT 1 FROM houses WHERE id = house_storage.house_id AND owner_id = auth.uid())
);
CREATE POLICY "House storage manageable by members" ON house_storage FOR ALL USING (
    EXISTS (SELECT 1 FROM house_members WHERE house_id = house_storage.house_id AND user_id = auth.uid() AND status = 'accepted')
    OR EXISTS (SELECT 1 FROM houses WHERE id = house_storage.house_id AND owner_id = auth.uid())
);
