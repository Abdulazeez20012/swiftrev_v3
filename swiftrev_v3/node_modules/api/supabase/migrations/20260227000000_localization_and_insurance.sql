-- Migration: 20260227000000_localization_and_insurance.sql
-- Goal: Support NHIS/HMO and Payment Proofs (Localization & Trust)

-- 1. Insurance Providers Table
CREATE TABLE insurance_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'HMO' CHECK (type IN ('NHIS', 'HMO', 'StateScheme')),
    contact_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update Transactions Table
ALTER TABLE transactions 
ADD COLUMN insurance_provider_id UUID REFERENCES insurance_providers(id),
ADD COLUMN auth_code TEXT,
ADD COLUMN proof_image_url TEXT;

-- 3. Update Payers (Patients) Table
ALTER TABLE payers
ADD COLUMN insurance_number TEXT;

-- 4. Enable RLS on new table
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;

-- 5. Basic RLS Policy for Insurance Providers (Public Read, Admin Write)
CREATE POLICY "Public Read Insurance Providers" ON insurance_providers
FOR SELECT USING (true);

-- 6. Add policy for transactions isolation (update existing or add to new cols)
-- The existing multi_tenant_policy_transactions already covers the table

-- 7. Seed Initial Data
INSERT INTO insurance_providers (name, type) VALUES
('NHIS (National Health Insurance Scheme)', 'NHIS'),
('Reliance HMO', 'HMO'),
('AXA Mansard Health', 'HMO'),
('Hygeia HMO', 'HMO'),
('Lagos State Health Scheme (LASHMA)', 'StateScheme');
