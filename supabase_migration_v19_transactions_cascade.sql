-- Migration V19: Add ON DELETE CASCADE to transactions table
-- Ensures deleting a profile does not crash due to existing transactions

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_from_user_id_fkey,
DROP CONSTRAINT IF EXISTS transactions_to_user_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_from_user_id_fkey
FOREIGN KEY (from_user_id) REFERENCES profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT transactions_to_user_id_fkey
FOREIGN KEY (to_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
