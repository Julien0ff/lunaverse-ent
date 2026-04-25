-- Migration V15: Messaging, Friends and Safety Sync
-- Ensures all core tables exist and have correct RLS policies to prevent 500 errors

-- 1. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages as read"
ON messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- 2. FRIENDS TABLE
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'pending', -- 'pending', 'accepted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friend relationships"
ON friends FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert their own friend requests"
ON friends FOR INSERT
WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their own friend relationships"
ON friends FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their own friend relationships"
ON friends FOR DELETE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 3. ENSURE ABSENCES TABLE EXISTS (Safety)
CREATE TABLE IF NOT EXISTS absences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    duration VARCHAR NOT NULL,
    attachments TEXT,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES profiles(id)
);

-- Ensure RLS for absences
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own absences" ON absences;
CREATE POLICY "Users can view their own absences" ON absences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own absences" ON absences;
CREATE POLICY "Users can insert their own absences" ON absences FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view and update all absences" ON absences;
CREATE POLICY "Admins can view and update all absences" ON absences FOR ALL
USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND (LOWER(r.name) = 'admin' OR LOWER(r.name) = 'staff')
));

-- 4. ENSURE HOUSES RLS (Safety update)
-- Already handled in V14, but let's be sure about the admin policy
DROP POLICY IF EXISTS "Admins can manage all houses" ON houses;
CREATE POLICY "Admins can manage all houses" ON houses FOR ALL
USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND (LOWER(r.name) = 'admin' OR LOWER(r.name) = 'staff')
));
