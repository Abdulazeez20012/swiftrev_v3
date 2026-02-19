# SwiftRev v3 Database Documentation

## Tables

### 1. `hospitals`
Stores clinical facilities using the platform.
- `id` (UUID, PK)
- `name` (TEXT)
- `address` (TEXT)
- `contact_info` (TEXT)
- `status` (active/suspended)

### 2. `roles`
System roles for RBAC.
- `id` (UUID, PK)
- `name` (TEXT, e.g., super_admin, agent)
- `permissions` (JSONB)

### 3. `users`
System users (staff, agents).
- `id` (UUID, PK)
- `email` (TEXT)
- `password_hash` (TEXT)
- `role_id` (FK → roles)
- `hospital_id` (FK → hospitals, nullable)

### 4. `departments`
Hospital departments (e.g., Pharmacy, Lab).
- `id` (UUID, PK)
- `hospital_id` (FK → hospitals)
- `name` (TEXT)

### 5. `revenue_items`
Bills/charges entities.
- `id` (UUID, PK)
- `hospital_id` (FK → hospitals)
- `department_id` (FK → departments)
- `name` (TEXT)
- `amount` (DECIMAL)

### 6. `payers`
Patients or corporate payers.
- `id` (UUID, PK)
- `hospital_id` (FK → hospitals)
- `name` (TEXT)
- `type` (individual/corporate)

### 7. `transactions`
Revenue transaction records.
- `id` (UUID, PK)
- `hospital_id` (FK → hospitals)
- `agent_id` (FK → users)
- `payer_id` (FK → payers)
- `revenue_item_id` (FK → revenue_items)
- `amount` (DECIMAL)
- `status` (pending/completed/failed/refunded)
- `payment_method` (cash/card/transfer)
- `client_transaction_id` (UUID, unique for sync)
- `synced_at` (TIMESTAMP)

### 8. `wallets`
Hospital balance tracking.
- `id` (UUID, PK)
- `hospital_id` (FK → hospitals, unique)
- `total_balance` (DECIMAL)

### 9. `refunds`
Refund records.
- `id` (UUID, PK)
- `hospital_id` (FK → hospitals)
- `transaction_id` (FK → transactions)
- `amount` (DECIMAL)
- `approved_by` (FK → users)

### 10. `audit_logs`
System-wide audit trail.
- `id` (UUID, PK)
- `hospital_id` (FK → hospitals)
- `user_id` (FK → users)
- `action` (TEXT)
- `entity_type` (TEXT)
- `entity_id` (UUID)

### 11. `ml_predictions`
AI/ML outputs storage.
- `id` (UUID, PK)
- `hospital_id` (FK → hospitals)
- `prediction_type` (fraud_score/revenue_forecast)
- `prediction_value` (JSONB)
- `confidence_score` (DECIMAL)

## Multi-Tenancy (RLS)
All data belonging to a hospital is protected by Row-Level Security (RLS). 
Each table has a `hospital_id` column, and broad policies ensure that:
1. Users can only access data where `hospital_id` matches their own.
2. Super Admins bypass these checks to manage the platform globally.
