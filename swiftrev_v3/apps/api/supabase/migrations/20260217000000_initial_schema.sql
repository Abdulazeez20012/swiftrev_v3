-- SwiftRev v3 Initial Schema Migration

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
    password_hash TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id),
    hospital_id UUID REFERENCES hospitals(id), -- Nullable for Super Admin
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

-- 7. Payers Table (Patients/Companies)
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
    client_transaction_id UUID NOT NULL UNIQUE, -- For offline deduplication
    synced_at TIMESTAMP WITH TIME ZONE, -- Null if created online
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
    entity_id UUID NOT NULL, -- transaction_id or hospital_id
    prediction_value JSONB NOT NULL,
    confidence_score DECIMAL(5, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
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

-- Basic Policy: Users can only see data belonging to their hospital
-- Note: Simplified policies for now, will be refined in Phase 1 Week 5-6 (Auth & Authorization)

CREATE POLICY hospital_isolation_policy ON hospitals FOR ALL USING (
  id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
);

CREATE POLICY multi_tenant_policy ON departments FOR ALL USING (
  hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
);

-- Repeat for other tables... (This is a simplified version for the migration file)
-- Revenue Items
CREATE POLICY multi_tenant_policy_revenue_items ON revenue_items FOR ALL USING (
  hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
);

-- Payers
CREATE POLICY multi_tenant_policy_payers ON payers FOR ALL USING (
  hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
);

-- Transactions
CREATE POLICY multi_tenant_policy_transactions ON transactions FOR ALL USING (
  hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
);

-- Wallets
CREATE POLICY multi_tenant_policy_wallets ON wallets FOR ALL USING (
  hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
);

-- Refunds
CREATE POLICY multi_tenant_policy_refunds ON refunds FOR ALL USING (
  hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
);

-- Audit Logs
CREATE POLICY multi_tenant_policy_audit_logs ON audit_logs FOR ALL USING (
  hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
);

-- ML Predictions
CREATE POLICY multi_tenant_policy_ml_predictions ON ml_predictions FOR ALL USING (
  hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin'))
);
