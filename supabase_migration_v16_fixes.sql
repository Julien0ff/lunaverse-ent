-- Migration V16: Fixes for Inventory RLS and Houses Realtime

-- 1. Fix inventory trigger silently failing due to RLS
-- Adding SECURITY DEFINER ensures the trigger runs with owner privileges, bypassing RLS
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add 'houses' to realtime publication so Discord bot can catch changes and create channels
ALTER PUBLICATION supabase_realtime ADD TABLE houses;
