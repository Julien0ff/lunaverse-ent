-- Migration: Canteen Extras & Date
-- Ajout des colonnes pour les nouveaux plats et le système de dates.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canteen_menus' AND column_name = 'menu_date') THEN
        ALTER TABLE canteen_menus ADD COLUMN menu_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canteen_menus' AND column_name = 'drink') THEN
        ALTER TABLE canteen_menus ADD COLUMN drink TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canteen_menus' AND column_name = 'side') THEN
        ALTER TABLE canteen_menus ADD COLUMN side TEXT;
    END IF;
    
    -- Rendre day_of_week optionnel puisqu'on utilise désormais menu_date
    ALTER TABLE canteen_menus ALTER COLUMN day_of_week DROP NOT NULL;
END $$;
