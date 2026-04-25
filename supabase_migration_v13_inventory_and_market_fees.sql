-- Migration V13: Inventory and Market Fees
-- Manages user inventory and adds listing fees to the market

-- 1. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID REFERENCES shop_items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 2. MARKET ENHANCEMENTS
ALTER TABLE market_listings 
ADD COLUMN IF NOT EXISTS image_url VARCHAR,
ADD COLUMN IF NOT EXISTS listing_fee DECIMAL DEFAULT 0;

-- 3. FUNCTION TO UPDATE INVENTORY ON PURCHASE
CREATE OR REPLACE FUNCTION update_inventory_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO inventory (user_id, item_id, quantity)
    VALUES (NEW.user_id, NEW.item_id, NEW.quantity)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET 
        quantity = inventory.quantity + EXCLUDED.quantity,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_inventory_on_purchase ON purchases;
CREATE TRIGGER tr_update_inventory_at
AFTER INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_purchase();

-- 4. RLS FOR INVENTORY
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inventory"
ON inventory FOR SELECT
USING (auth.uid() = user_id);

-- Initialize inventory from existing purchases
INSERT INTO inventory (user_id, item_id, quantity)
SELECT user_id, item_id, SUM(quantity)
FROM purchases
GROUP BY user_id, item_id
ON CONFLICT (user_id, item_id) DO NOTHING;
