-- SwiftRev v3 CLEAN SLATE Initial Schema Migration
-- WARNING: This will drop existing tables and recreate them. 
-- Safe to run if your database is currently empty or in a partial state.

-- 0. Clean up existing tables to avoid type mismatches
-- CASCADE ensures that dependent objects (like the 'agents' table) are also dropped.
DROP TABLE IF EXISTS ml_predictions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS payers CASCADE;
DROP TABLE IF EXISTS revenue_items CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Hospitals Table
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    contact_info TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT, -- Using Supabase Auth, so this is optional
    role_id UUID NOT NULL REFERENCES roles(id),
    hospital_id UUID REFERENCES hospitals(id), -- Nullable for Super Admin
    full_name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Revenue Items Table
CREATE TABLE revenue_items (
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
CREATE TABLE payers (
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
CREATE TABLE transactions (
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
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL UNIQUE REFERENCES hospitals(id),
    total_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Refunds Table
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    amount DECIMAL(15, 2) NOT NULL,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Audit Logs Table
CREATE TABLE audit_logs (
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
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('fraud_score', 'revenue_forecast')),
    entity_id UUID NOT NULL,
    prediction_value JSONB NOT NULL,
    confidence_score DECIMAL(5, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED DATA
INSERT INTO roles (name, permissions)
VALUES 
    ('super_admin', '{"all": true}'),
    ('hospital_admin', '{"hospital": true}'),
    ('field_agent', '{"transactions": true}');

INSERT INTO hospitals (name, status)
VALUES ('Default General Hospital', 'active');

-- SYNC SPECIFIC USERS (Linking Auth users to Public users)
DO $$
DECLARE
    super_admin_id UUID;
BEGIN
    SELECT id INTO super_admin_id FROM roles WHERE name = 'super_admin';

    -- Provision admin@swiftrev.com
    INSERT INTO users (email, role_id, full_name, status)
    VALUES ('admin@swiftrev.com', super_admin_id, 'System Admin', 'active')
    ON CONFLICT (email) DO NOTHING;

    -- Provision admintest@swiftrev.com
    INSERT INTO users (email, role_id, full_name, status)
    VALUES ('admintest@swiftrev.com', super_admin_id, 'Test Admin', 'active')
    ON CONFLICT (email) DO NOTHING;
END $$;

-- RLS
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;

-- Basic Policy
CREATE POLICY hospital_isolation_policy ON hospitals FOR ALL USING (
    id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
);
