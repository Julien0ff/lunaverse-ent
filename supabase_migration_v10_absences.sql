-- Migration: Absence Management
-- Added to track student and staff absences with reason and attachments

CREATE TABLE IF NOT EXISTS absences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    duration VARCHAR NOT NULL, -- e.g., '1 jour', 'Matinée', '2 heures'
    attachments TEXT, -- Store a URL or description of attachments
    status VARCHAR DEFAULT 'pending', -- 'pending', 'accepted', 'refused'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES profiles(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_absences_user_id ON absences(user_id);
CREATE INDEX IF NOT EXISTS idx_absences_status ON absences(status);

-- RLS
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own absences"
ON absences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own absences"
ON absences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all absences"
ON absences FOR ALL
USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
));
