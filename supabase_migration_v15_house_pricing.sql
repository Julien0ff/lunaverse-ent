-- Migration V15: House Pricing System
-- Adds house_type and square_meters fields + stores purchase price

ALTER TABLE houses ADD COLUMN IF NOT EXISTS house_type VARCHAR DEFAULT NULL;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS square_meters INTEGER DEFAULT NULL;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2) DEFAULT 0;
