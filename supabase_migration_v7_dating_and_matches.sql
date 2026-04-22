-- Migration: Luna Match Multi-photos
-- Ajout de la colonne dating_photos pour permettre de stocker un tableau de photos.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dating_photos') THEN
        ALTER TABLE profiles ADD COLUMN dating_photos JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
