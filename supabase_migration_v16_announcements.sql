-- Migration: Announcements & Info-Trafic
-- Stores scheduled courses and immediate info-trafic

CREATE TABLE IF NOT EXISTS course_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR NOT NULL, -- 'course', 'info'
    target_class VARCHAR, -- 'nova', 'nebuleuse', 'both', null
    subject VARCHAR,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    replacement_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    info_status VARCHAR, -- 'supprime', 'remplace', 'retard', 'deplace', 'autre'
    info_text TEXT,
    status VARCHAR DEFAULT 'pending', -- 'pending', 'sent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_announcements_status ON course_announcements(status);
CREATE INDEX IF NOT EXISTS idx_course_announcements_start_time ON course_announcements(start_time);

ALTER TABLE course_announcements ENABLE ROW LEVEL SECURITY;

-- Admins can manage announcements
CREATE POLICY "Admins can manage announcements"
ON course_announcements FOR ALL
USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
));

-- Users can view announcements
CREATE POLICY "Users can view announcements"
ON course_announcements FOR SELECT
USING (true);
