-- Migration: 20260301000000_claims_and_groups.sql
-- Goal: Support NHIS Claims Settlement and Multi-Hospital Groups (Cumulative Fix)

-- 1. Ensure Phase A Columns exist (in case migration was skipped)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='insurance_provider_id') THEN
        ALTER TABLE transactions ADD COLUMN insurance_provider_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='auth_code') THEN
        ALTER TABLE transactions ADD COLUMN auth_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='proof_image_url') THEN
        ALTER TABLE transactions ADD COLUMN proof_image_url TEXT;
    END IF;
END $$;

-- 2. Add Phase B settlement fields to transactions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='settlement_status') THEN
        ALTER TABLE transactions 
        ADD COLUMN settlement_status VARCHAR(20) DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'processing', 'settled', 'rejected')),
        ADD COLUMN settlement_date TIMESTAMP WITH TIME ZONE,
        ADD COLUMN settlement_reference VARCHAR(100);
    END IF;
END $$;

-- 3. Create Hospital Groups Table (for state-wide management)
CREATE TABLE IF NOT EXISTS hospital_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    state VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add group_id to hospitals
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='group_id') THEN
        ALTER TABLE hospitals ADD COLUMN group_id UUID REFERENCES hospital_groups(id);
    END IF;
END $$;

-- 5. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_transactions_settlement ON transactions(settlement_status) WHERE insurance_provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hospitals_group ON hospitals(group_id);
