-- SwiftRev v3 IDEMPOTENT Initial Schema Migration
-- Run this in the Supabase SQL Editor

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    contact_info TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT, -- Made nullable if using Supabase Auth strictly
    role_id UUID NOT NULL REFERENCES roles(id),
    hospital_id UUID REFERENCES hospitals(id), -- Nullable for Super Admin
    full_name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Revenue Items Table
CREATE TABLE IF NOT EXISTS revenue_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Payers Table
CREATE TABLE IF NOT EXISTS payers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    type TEXT NOT NULL DEFAULT 'individual' CHECK (type IN ('individual', 'corporate')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    agent_id UUID NOT NULL REFERENCES users(id),
    payer_id UUID NOT NULL REFERENCES payers(id),
    revenue_item_id UUID NOT NULL REFERENCES revenue_items(id),
    amount DECIMAL(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
    client_transaction_id UUID NOT NULL UNIQUE,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL UNIQUE REFERENCES hospitals(id),
    total_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    amount DECIMAL(15, 2) NOT NULL,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id),
    user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. ML Predictions Table
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('fraud_score', 'revenue_forecast')),
    entity_id UUID NOT NULL,
    prediction_value JSONB NOT NULL,
    confidence_score DECIMAL(5, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED DATA (Only if not already present)
INSERT INTO roles (name, permissions)
VALUES 
    ('super_admin', '{"all": true}'),
    ('hospital_admin', '{"hospital": true}'),
    ('field_agent', '{"transactions": true}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO hospitals (name, status)
VALUES ('Default General Hospital', 'active')
ON CONFLICT DO NOTHING;

-- RLS (Safely adding policies)
DO $$ 
BEGIN
    ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    -- Add other tables if needed
EXCEPTION WHEN OTHERS THEN 
    NULL;
END $$;

-- Policies (Only if not already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hospital_isolation_policy') THEN
        CREATE POLICY hospital_isolation_policy ON hospitals FOR ALL USING (
            id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
        );
    END IF;
END $$;

-- SYNC SPECIFIC USERS (Linking Auth users to Public users)
DO $$
DECLARE
    super_admin_id UUID;
BEGIN
    SELECT id INTO super_admin_id FROM roles WHERE name = 'super_admin';

    -- Provision admin@swiftrev.com
    INSERT INTO users (email, role_id, full_name)
    VALUES ('admin@swiftrev.com', super_admin_id, 'System Admin')
    ON CONFLICT (email) DO NOTHING;

    -- Provision admintest@swiftrev.com
    INSERT INTO users (email, role_id, full_name)
    VALUES ('admintest@swiftrev.com', super_admin_id, 'Test Admin')
    ON CONFLICT (email) DO NOTHING;
END $$;
