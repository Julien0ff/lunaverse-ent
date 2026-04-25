-- Migration: Market and Social Enhancements
-- Adds support for peer-to-peer marketplace and user profile customization

-- 1. PROFILE ENHANCEMENTS
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR,
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR,
ADD COLUMN IF NOT EXISTS github_url VARCHAR,
ADD COLUMN IF NOT EXISTS website_url VARCHAR;

-- 2. LUNA MARKET
CREATE TABLE IF NOT EXISTS market_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID REFERENCES shop_items(id) ON DELETE CASCADE,
    price DECIMAL NOT NULL CHECK (price >= 0),
    status VARCHAR DEFAULT 'active', -- 'active', 'sold', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sold_at TIMESTAMP WITH TIME ZONE,
    buyer_id UUID REFERENCES profiles(id)
);

-- Index for market performance
CREATE INDEX IF NOT EXISTS idx_market_listings_status ON market_listings(status);
CREATE INDEX IF NOT EXISTS idx_market_listings_seller_id ON market_listings(seller_id);

-- 3. RLS FOR MARKET
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market listings are viewable by everyone"
ON market_listings FOR SELECT
USING (true);

CREATE POLICY "Users can create their own listings"
ON market_listings FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own active listings"
ON market_listings FOR UPDATE
USING (auth.uid() = seller_id AND status = 'active');

-- 4. PURCHASE FUNCTION
CREATE OR REPLACE FUNCTION handle_market_purchase(listing_id UUID, buyer_user_id UUID)
RETURNS VOID AS $$
DECLARE
    listing_record RECORD;
BEGIN
    -- Select and lock listing
    SELECT * INTO listing_record FROM market_listings WHERE id = listing_id AND status = 'active' FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing not found or already sold';
    END IF;

    -- Update buyer balance
    UPDATE profiles SET balance = balance - listing_record.price WHERE id = buyer_user_id;
    
    -- Update seller balance
    UPDATE profiles SET balance = balance + listing_record.price WHERE id = listing_record.seller_id;
    
    -- Update listing status
    UPDATE market_listings SET 
        status = 'sold', 
        buyer_id = buyer_user_id, 
        sold_at = NOW() 
    WHERE id = listing_id;

    -- Record transaction
    INSERT INTO transactions (from_user_id, to_user_id, amount, type, description)
    VALUES (buyer_user_id, listing_record.seller_id, listing_record.price, 'market', 'Achat d''objet sur le Luna Market');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
