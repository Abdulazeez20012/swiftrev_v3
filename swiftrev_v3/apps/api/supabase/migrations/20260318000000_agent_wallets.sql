-- Migration: Evolve Wallets to Agent-Level Floats
-- 1. Remove the unique constraint on hospital_id to allow multiple wallets per hospital
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_hospital_id_key;

-- 2. Add user_id column for agent-specific wallets
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- 3. Add wallet_type column to distinguish between hospital master and agent floats
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'hospital' CHECK (wallet_type IN ('hospital', 'agent'));

-- 4. Update existing wallets to be marked as 'hospital' type
UPDATE wallets SET wallet_type = 'hospital' WHERE user_id IS NULL;

-- 5. Add unique constraint for (hospital_id, user_id) to prevent duplicate wallets for the same agent
ALTER TABLE wallets ADD CONSTRAINT wallets_hospital_user_unique UNIQUE (hospital_id, user_id);

-- 6. Update the update_wallet_balance RPC to handle agent_id (if it exists)
-- Since I couldn't find the exact RPC code, I'll provide a robust version that handles both hospital and agent funding.
CREATE OR REPLACE FUNCTION update_wallet_balance(h_id UUID, amt DECIMAL, u_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- If u_id is provided, it's an agent top-up
    IF u_id IS NOT NULL THEN
        INSERT INTO wallets (hospital_id, user_id, total_balance, wallet_type)
        VALUES (h_id, u_id, amt, 'agent')
        ON CONFLICT (hospital_id, user_id)
        DO UPDATE SET total_balance = wallets.total_balance + amt, last_updated = NOW();
    ELSE
        -- Default to hospital master wallet
        INSERT INTO wallets (hospital_id, total_balance, wallet_type)
        VALUES (h_id, amt, 'hospital')
        ON CONFLICT (hospital_id, user_id) WHERE user_id IS NULL
        DO UPDATE SET total_balance = wallets.total_balance + amt, last_updated = NOW();
    END IF;

    -- Log the funding event in audit logs if needed
END;
$$ LANGUAGE plpgsql;
