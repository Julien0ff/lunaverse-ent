-- Satisfaction Forms Table
CREATE TABLE IF NOT EXISTS satisfaction_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_discord_id VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'draft', -- 'draft', 'completed'
    q_reg_simplicity INTEGER,
    q_reg_speed INTEGER,
    q_pronote_exp TEXT,
    q_pronote_device VARCHAR, -- 'PC', 'Mobile'
    q_pronote_worked BOOLEAN,
    q_ent_likes TEXT,
    q_ent_improvements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intervews Table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_discord_id VARCHAR NOT NULL,
    rp_firstname VARCHAR,
    rp_lastname VARCHAR,
    inspector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_role VARCHAR,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'draft', -- 'draft', 'pending', 'accepted', 'refused'
    questions_data JSONB, -- Stores the selected questions and their marks
    dossier_note DECIMAL,
    interview_note DECIMAL,
    global_note DECIMAL,
    observation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_satisfaction_forms_updated_at ON satisfaction_forms;
CREATE TRIGGER update_satisfaction_forms_updated_at
BEFORE UPDATE ON satisfaction_forms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interviews_updated_at ON interviews;
CREATE TRIGGER update_interviews_updated_at
BEFORE UPDATE ON interviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
