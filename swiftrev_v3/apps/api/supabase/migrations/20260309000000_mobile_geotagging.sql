-- Migration: 20260309000000_mobile_geotagging.sql
-- Goal: Support Geotagging for mobile transactions

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='latitude') THEN
        ALTER TABLE transactions ADD COLUMN latitude DECIMAL(10, 8);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='longitude') THEN
        ALTER TABLE transactions ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
END $$;

-- Create an index for proximity searches if needed in the future
CREATE INDEX IF NOT EXISTS idx_transactions_location ON transactions(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
