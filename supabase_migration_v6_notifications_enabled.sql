-- Migration: Notifications Enabled
-- Ajout de la colonne notifications_enabled dans la table profiles
-- Nécessaire pour que le bot Discord puisse vérifier si l'utilisateur a activé les MPs

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notifications_enabled') THEN
        ALTER TABLE profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;
