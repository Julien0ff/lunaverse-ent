-- Migration: Inscriptions RP (v17)

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS public.inscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  discord_id text NOT NULL,
  prenom text NOT NULL,
  nom text NOT NULL,
  dob text,
  description text,
  classe text NOT NULL, -- 'NOV' | 'NÉB'
  langue text,
  options jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'refused'
  responses_channel_id text, -- Discord channel ID where to send the final response
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres inscriptions
CREATE POLICY "Users can view their own inscriptions"
  ON public.inscriptions FOR SELECT
  USING (discord_id = (SELECT discord_id FROM profiles WHERE id = auth.uid()));

-- Les admins (service role) ou roles 'admin' peuvent tout faire
CREATE POLICY "Admins can manage inscriptions"
  ON public.inscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Trigger pour updated_at
CREATE TRIGGER update_inscriptions_modtime
  BEFORE UPDATE ON public.inscriptions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
