-- ============================================================
-- LunaVerse ENT — Migration: Survival Stats + Dating Fields
-- Run this in Supabase → SQL Editor
-- ============================================================

-- 1. Add survival stats columns to profiles
--    Names match those used in the Discord bot (hunger/thirst/fatigue/hygiene/alcohol/health)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS health    SMALLINT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS hunger    SMALLINT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS thirst    SMALLINT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS fatigue   SMALLINT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS hygiene   SMALLINT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS alcohol   SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_metabolism_tick TIMESTAMP WITH TIME ZONE;

-- 2. Add dating fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dating_photo_url VARCHAR,
  ADD COLUMN IF NOT EXISTS dating_bio       TEXT;

-- 3. Create Supabase Storage bucket for dating photos (public)
--    (Can also be done from dashboard: Storage > New bucket > "dating" > public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dating', 'dating', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to the dating bucket
DROP POLICY IF EXISTS "dating_upload" ON storage.objects;
CREATE POLICY "dating_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dating');

DROP POLICY IF EXISTS "dating_public_read" ON storage.objects;
CREATE POLICY "dating_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'dating');

-- 4. Taxes table extra column
ALTER TABLE taxes
  ADD COLUMN IF NOT EXISTS is_preleve BOOLEAN NOT NULL DEFAULT TRUE;

-- 5. Shop suggestions (user → admin pipeline)
CREATE TABLE IF NOT EXISTS shop_suggestions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  estimated_price NUMERIC,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);
-- Only admins can read all suggestions; users can write
ALTER TABLE shop_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_suggestions_insert" ON shop_suggestions;
CREATE POLICY "shop_suggestions_insert" ON shop_suggestions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "shop_suggestions_select_admin" ON shop_suggestions;
-- All authenticated can see (admin filtering done in API)
CREATE POLICY "shop_suggestions_select_admin" ON shop_suggestions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "shop_suggestions_delete_admin" ON shop_suggestions;
CREATE POLICY "shop_suggestions_delete_admin" ON shop_suggestions
  FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "shop_suggestions_update_admin" ON shop_suggestions;
CREATE POLICY "shop_suggestions_update_admin" ON shop_suggestions
  FOR UPDATE TO authenticated USING (true);

-- 6. Finance Publique (admin-ordered taxes/fines journal)
CREATE TABLE IF NOT EXISTS finance_publique (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id   UUID REFERENCES profiles(id),
  reason     TEXT NOT NULL,
  amount     NUMERIC NOT NULL,
  type       TEXT NOT NULL DEFAULT 'tax', -- tax | fine | reward
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE finance_publique ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_publique_admin" ON finance_publique;
CREATE POLICY "finance_publique_admin" ON finance_publique
  FOR ALL TO authenticated USING (true);

-- 7. Canteen Menus (Saturday/Sunday management)
CREATE TABLE IF NOT EXISTS canteen_menus (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week   SMALLINT NOT NULL, -- 0-6 (0=Sunday, 6=Saturday)
  time_start    TIME NOT NULL,
  time_end      TIME NOT NULL,
  starter       TEXT,
  main          TEXT NOT NULL,
  dessert       TEXT,
  note          TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE canteen_menus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "canteen_menus_read" ON canteen_menus;
CREATE POLICY "canteen_menus_read" ON canteen_menus
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "canteen_menus_admin" ON canteen_menus;
CREATE POLICY "canteen_menus_admin" ON canteen_menus
  FOR ALL TO authenticated USING (true); -- Admin filtering handled in API or check role

-- 8. Messages Image Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_images_upload" ON storage.objects;
CREATE POLICY "chat_images_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-images');

DROP POLICY IF EXISTS "chat_images_read" ON storage.objects;
CREATE POLICY "chat_images_read" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'chat-images');

