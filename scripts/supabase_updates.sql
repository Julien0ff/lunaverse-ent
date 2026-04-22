-- 1. Ajout des barres de survie et état physique au profil
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS health INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS food INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS water INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS sleep INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS hygiene INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS alcohol INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS game_fatigue INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS canteen_subscription VARCHAR DEFAULT 'none',
ADD COLUMN IF NOT EXISTS canteen_subscription_end TIMESTAMP WITH TIME ZONE;

-- 1.b Ajout des informations de profil RP
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dob VARCHAR(20),
ADD COLUMN IF NOT EXISTS sexe VARCHAR(20) DEFAULT 'Masculin',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS pronote_avatar_url VARCHAR,
ADD COLUMN IF NOT EXISTS status_visibility VARCHAR(20) DEFAULT 'public';

-- 1.c Ajout des colonnes Luna Match (Dating opt-in)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dating_photo_url VARCHAR,
ADD COLUMN IF NOT EXISTS dating_bio TEXT;

-- 2. Création de la table des Swipes Tinder (Rencontres)
CREATE TABLE IF NOT EXISTS dating_swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  swiped_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  liked BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

-- Active RLS sur dating_swipes mais laisse l'accès (ou configurer selon votre setup)
-- Assurez-vous d'avoir les RLS désactivés ou une policy qui permet l'accès en service_role

-- 3. Taxes / Impôts - Recréation propre avec target_id et created_by
DROP TABLE IF EXISTS taxes;
CREATE TABLE IF NOT EXISTS taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Paramètres globaux du bot/serveur
CREATE TABLE IF NOT EXISTS server_settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Colonne nickname_rp sur les profils (si pas encore ajoutée)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS nickname_rp VARCHAR(100),
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS pronote_id VARCHAR(100);

