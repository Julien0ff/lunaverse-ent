CREATE TABLE pronote_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pronote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own requests"
    ON pronote_requests FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can view their own requests"
    ON pronote_requests FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Admins can view and update all requests"
    ON pronote_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            JOIN roles ON user_roles.role_id = roles.id
            WHERE user_roles.user_id = auth.uid() AND roles.name = 'admin'
        )
    );
