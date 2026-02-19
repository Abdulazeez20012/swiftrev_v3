// --- 1. USER & ROLE MANAGEMENT ---

export interface Role {
    id: string; // Serial -> string for local
    name: 'Super Admin' | 'Finance Admin' | 'Hospital Admin' | 'Agent' | 'Auditor';
    description?: string;
    created_at: string;
}

export interface User {
    id: string;
    role_id: string; // FK to Role
    hospital_id?: string; // Nullable for Super Admin
    full_name: string;
    email?: string;
    phone?: string;
    password_hash: string;
    is_active: boolean;
    last_login?: string;
    created_at: string;
}

// --- 2. HOSPITAL STRUCTURE ---

export interface Hospital {
    id: string;
    name: string;
    code?: string;
    address?: string;
    state?: string;
    created_at: string;
}

export interface Department {
    id: string;
    hospital_id: string; // FK to Hospital
    name: string;
    created_at: string;
}

// --- 3. REVENUE & TRANSACTIONS ---

export interface RevenueItem {
    id: string;
    department_id: string; // FK to Department
    description: string;
    code: string;
    amount: number;
    status: 'active' | 'inactive';
    created_at: string;
}

export interface Transaction {
    id: string;
    transaction_ref: string; // Unique
    hospital_id: string;
    department_id: string;
    agent_id: string;
    approved_by?: string; // Nullable

    patient_name?: string;
    payment_method: 'CASH' | 'POS' | 'TRANSFER';

    amount: number;
    service_charge: number;
    net_amount: number;

    status: 'PENDING' | 'APPROVED' | 'REJECTED';

    transaction_date: string; // Date string
    approved_at?: string;
    created_at: string;

    // Additional fields for local context if needed
    channel?: 'ONLINE' | 'OFFLINE';
}

// --- 4. WALLET SYSTEM ---

export interface HospitalWallet {
    id: string;
    hospital_id: string; // Unique FK
    total_balance: number;
    last_updated: string;
}

// --- 5. REFUNDS & REVERSALS ---

export interface Refund {
    id: string;
    transaction_id: string;
    approved_by: string;
    reason: string;
    refund_amount: number;
    refund_date: string;
    created_at: string;
}

// --- 6. AUDIT TRAIL ---

export interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    table_name: string;
    record_id: string;
    old_value?: any; // JSONB
    new_value?: any; // JSONB
    ip_address?: string;
    created_at: string;
}


// --- GENERIC TYPES ---

export interface DataResponse<T> {
    data: T | null;
    error: Error | null;
}
