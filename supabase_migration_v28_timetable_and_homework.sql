-- Migration v28: Emploi du Temps (EDT) & Devoirs (Cahier de textes) pour LunaVerse RP
-- Optimisé pour les cours du week-end (Samedi et Dimanche, 12h00 - 19h30)

-- 1. Table des cours de l'Emploi du Temps
CREATE TABLE IF NOT EXISTS timetable_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_class VARCHAR NOT NULL, -- ex: 'Classe Nova', 'Classe Nébuleuse', 'all'
    subject VARCHAR NOT NULL,      -- ex: 'Mathématiques', 'Français', 'Histoire-Géo'
    teacher_name VARCHAR,          -- Nom du professeur affiché
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    room VARCHAR,                  -- ex: 'Salle 102', 'Gymnase'
    day_of_week SMALLINT NOT NULL, -- 6 = Samedi, 0 = Dimanche
    start_time TIME NOT NULL,      -- ex: '14:00:00'
    end_time TIME NOT NULL,        -- ex: '15:00:00'
    color VARCHAR DEFAULT '#5865F2', -- Code couleur matière
    status VARCHAR DEFAULT 'normal', -- 'normal', 'modifie', 'deplace', 'annule', 'prof_absent'
    status_note TEXT,              -- Motif de changement (ex: 'Professeur absent', 'Déplacé en Salle 204')
    pronote_id VARCHAR,            -- Identifiant Pronote pour la synchro
    last_announced_date DATE,      -- Pour éviter de re-publier deux fois le même jour
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Devoirs / Travail à faire
CREATE TABLE IF NOT EXISTS homeworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_class VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    teacher_name VARCHAR,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    pronote_id VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Suivi individuel des devoirs faits par élève
CREATE TABLE IF NOT EXISTS user_homework_status (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    homework_id UUID REFERENCES homeworks(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, homework_id)
);

-- 4. Index et Sécurité RLS
CREATE INDEX IF NOT EXISTS idx_timetable_day_class ON timetable_courses(day_of_week, target_class);
CREATE INDEX IF NOT EXISTS idx_homeworks_due_date ON homeworks(due_date);

ALTER TABLE timetable_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_homework_status ENABLE ROW LEVEL SECURITY;

-- Lecture ouverte pour tous les utilisateurs connectés
DROP POLICY IF EXISTS "timetable_read_all" ON timetable_courses;
CREATE POLICY "timetable_read_all" ON timetable_courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "homeworks_read_all" ON homeworks;
CREATE POLICY "homeworks_read_all" ON homeworks FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_hw_own" ON user_homework_status;
CREATE POLICY "user_hw_own" ON user_homework_status FOR ALL USING (auth.uid() = user_id);

-- Modification réservée aux admins et professeurs
DROP POLICY IF EXISTS "timetable_write_admin" ON timetable_courses;
CREATE POLICY "timetable_write_admin" ON timetable_courses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND (r.name = 'admin' OR r.name = 'professeur' OR r.name = 'Professeur')
    )
);

DROP POLICY IF EXISTS "homeworks_write_admin" ON homeworks;
CREATE POLICY "homeworks_write_admin" ON homeworks FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND (r.name = 'admin' OR r.name = 'professeur' OR r.name = 'Professeur')
    )
);
