-- Default Roles and Test Data Seed

-- 1. Insert Default Roles
INSERT INTO roles (name, permissions) VALUES 
('super_admin', '{"all": true}'::jsonb),
('finance_admin', '{"transactions": ["read"], "reports": ["read"], "refunds": ["approve"]}'::jsonb),
('hospital_admin', '{"departments": ["all"], "revenue_items": ["all"], "users": ["read", "create"]}'::jsonb),
('agent', '{"transactions": ["create", "read"], "payers": ["all"]}'::jsonb),
('auditor', '{"transactions": ["read"], "audit_logs": ["read"], "reports": ["read"]}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert a Sample Hospital
INSERT INTO hospitals (name, address, contact_info) 
VALUES ('General Hospital Lagos', '123 Broad St, Lagos Island', 'info@ghlagos.com')
ON CONFLICT DO NOTHING;

-- 3. Insert a Sample Department
INSERT INTO departments (hospital_id, name, description)
SELECT id, 'Outpatient Department', 'General consultations and minor procedures'
FROM hospitals WHERE name = 'General Hospital Lagos'
ON CONFLICT DO NOTHING;

-- 4. Insert a Sample Revenue Item
INSERT INTO revenue_items (hospital_id, department_id, name, description, amount)
SELECT h.id, d.id, 'General Consultation', 'Standard consultation fee', 5000.00
FROM hospitals h, departments d
WHERE h.name = 'General Hospital Lagos' AND d.name = 'Outpatient Department'
ON CONFLICT DO NOTHING;

-- 5. Insert a Test Super Admin (password is 'password123' hashed)
-- password_hash for 'password123' using bcrypt (cost 10): $2a$10$7R9rRj.U2K9iA.5lV6S9Se7R9rRj.U2K9iA.5lV6S9Se7R9rRj
-- (Note: In real development, the actual hash should be generated properly)
INSERT INTO users (email, password_hash, role_id)
SELECT 'superadmin@swiftrev.com', '$2a$10$7R9rRj.U2K9iA.5lV6S9Se7R9rRj.U2K9iA.5lV6S9Se7R9rRj.U2K9iA.5lV6S9Se', id
FROM roles WHERE name = 'super_admin'
ON CONFLICT (email) DO NOTHING;

-- 6. Insert a Test Hospital Admin
INSERT INTO users (email, password_hash, role_id, hospital_id)
SELECT 'admin@ghlagos.com', '$2a$10$7R9rRj.U2K9iA.5lV6S9Se7R9rRj.U2K9iA.5lV6S9Se7R9rRj.U2K9iA.5lV6S9Se', r.id, h.id
FROM roles r, hospitals h
WHERE r.name = 'hospital_admin' AND h.name = 'General Hospital Lagos'
ON CONFLICT (email) DO NOTHING;
