SwiftRev v3 is an Hospital financeial operating system .
                ┌──────────────────────┐
                │   Web App (Admin)    │
                │   Mobile (Agents)    │
                └──────────┬───────────┘
                           │
                ┌──────────▼───────────┐
                │     API Gateway      │
                └──────────┬───────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
 Revenue Cycle       Core Finance        Integrations
   Services             Engine              Layer

and also mobile for patients to pay bills and view their medical records and appointment.

SwiftRev Logic
Admin Role:
DASHBORD
The Admin Core Dashboard should display consolidated data from all hospitals where the system has been deployed.
   Enhanced Transaction & Collection Monitoring Module & TOP-UP MODULE (Agent / Cashier Funding per Hospital)
The Top-Up module allows hospitals to allocate and manage operational funds for agents or cashiers within their facility.
This ensures proper financial control, accountability, and transaction tracking.
Workflow Steps
Step 1: Login & Access
Finance Admin logs into the system.
System validates credentials and grants access to the Finance module.
Step 2: Select Hospital
Admin selects a hospital from the hospital list.
System loads all agents/cashiers associated with the selected hospital.
Step 3: Select Agent/Cashier
Admin selects the intended Agent/Cashier.
System retrieves and displays the current wallet balance.
Step 4: Enter Funding Amount
Admin inputs the amount to credit.
System validates:
Amount is numeric.
Amount is greater than zero.
Admin has authorization to fund.
Step 5: Transaction Review & Approval
System displays confirmation summary:
Hospital Name
Agent/Cashier Name
Amount
Current Wallet Balance
Admin confirms and approves transaction.
Step 6: Wallet Update
System processes the transaction.
Wallet balance is updated in real-time.
System generates a unique transaction reference ID.
Step 7: Audit Trail Logging
System logs the following details:
Admin ID
Hospital ID
Agent/Cashier ID
Amount credited
Previous balance
New balance
Date & Time
Transaction reference ID
Step 8: Notification (Optional)
System may send notification to the Agent/Cashier confirming wallet funding. 

Swift Rev Logic
USERS

MAIN ADMIN
ADMIN-USERS
NEW HOSPITAL
FIELD AGENT
FINANCE OFFICER

ROLES OF EACH FIELD AGENT
CREATE PATIENT (When a New patient comes to pay)
Bill and clear the patient bill
Check previous transactions
Print receipt after successful payment

ROLES OF EACH FINANCE OFFICER IN THE HOSPITAL
Check total money made for the day/week/month or at any interval
Check transactions made by field agent
Check total agents and name
Search any transaction at anytime
Report generation
Check how much made based on each income heads (Departments)

ROLES OF THE ADMIN(SwiftRev Team)
Create New Hospital
Create the FO / Field Agents for the hospitals
Manage the hospitals and it’s agents
Top-Up Agents Virtual Funds
Check total transactions of each hospitals
Create Income heads for each hospital
Enhanced finance reports


HOSPITAL REVENUE MANAGEMENT SYSTEM
(Proposed Software Architecture & Functional Breakdown)
1️⃣ SYSTEM OVERVIEW
This system is designed to:
Process hospital payments (clinical services, procedures, etc.)
Track daily revenue
Manage wallet funding
Store payer/patient information
Provide transaction reporting (online & offline)
Support reconciliation and auditing
Primary Users:
Cashiers
Account Officers
Finance Managers
System Admin
2️⃣ CORE MODULES (From Your Screens)
MODULE 1: Dashboard (Financial Overview)
Purpose:
Provide real-time financial visibility.
Key Components:
A. Wallet Balance
Displays available institutional balance.
Data Source: wallet_ledger table.
Auto-updated after every transaction.
B. Last Wallet Credit
Shows last funding entry.
Useful for reconciliation.
Tracks:
Credit amount
Date
Funding source
C. Today’s Transactions Summary
Total amount processed today.
Total transaction count.
Filtered by:
Date = Current Date
Status = Successful
MODULE 2: Revenue Item Management
(From “Add Revenue Item” screen)
Purpose:
Define billable hospital services.
Data Fields:
Department
Description
Code
Amount
Backend Structure:
Table: revenue_items
Field
Type
id
UUID
department_id
FK
description
Text
code
Varchar
amount
Decimal
status
Active/Inactive
created_at
Timestamp
Why This Module Matters:
Prevents manual pricing errors
Standardizes billing
Allows departmental reporting
MODULE 3: Payment Processing
Flow:
Select Revenue Item
Enter Amount (if variable)
Enter Payer Information
Confirm & Generate Transaction ID
Deduct / Record
Issue Receipt
MODULE 4: Payer Information Management
From your “Payer Information” screen:
Fields:
First Name
Other Names
Patient Number
Phone
Email
Backend Table: payers
Field
Type
id
UUID
firstname
Text
other_names
Text
patient_no
Varchar
phone
Varchar
email
Varchar
created_at
Timestamp
System Intelligence Opportunity:
If patient_no exists → auto-fetch payer data
Prevent duplicate patient records
MODULE 5: Transaction Engine
This is the heart of the system.
Each transaction includes:
Transaction ID (e.g., AI09820251029093508)
Date & Time
Amount
Channel (Online / Offline)
Status
Revenue Item ID
Cashier ID
Wallet impact
Transaction Table
transactions
Field
Type
id
UUID
transaction_ref
Unique
payer_id
FK
revenue_item_id
FK
amount
Decimal
channel
Online/Offline
status
Pending/Success/Failed
created_at
Timestamp
MODULE 6: Online vs Offline Mode
Very important for Nigerian hospital environments.
ONLINE:
Real-time processing
Immediate wallet update
Instant receipt generation
OFFLINE:
Transaction stored locally
Sync when internet is restored
Must prevent duplicate sync
Technical Suggestion:
Use local storage queue
Add sync_status column
Use background worker for syncing
MODULE 7: Transaction History
From your screenshots:
Daily breakdown:
Date
Total amount
Total count
Reporting Queries:
Daily Report:
Copy code

GROUP BY date(created_at)
SUM(amount)
COUNT(id)
This allows:
Revenue forecasting
Peak-day analysis
Department comparison
3️⃣ SECURITY ARCHITECTURE
Must include:
Role-Based Access Control (RBAC)
Token-based authentication
Encrypted API communication
Audit log tracking
User Roles:
Role
Permissions
Cashier
Create payments
Accountant
View reports
Admin
Manage revenue items
Super Admin
Full control
4️⃣ WALLET LOGIC DESIGN
Every transaction affects wallet:
If Payment: → Credit wallet
If Refund: → Debit wallet
Ledger Table:
| id | transaction_id | type | amount | balance_after |
Never calculate balance dynamically. Always store balance snapshot.
5️⃣ ADVANCED FEATURES TO BUILD
To make this system enterprise-grade:
🔹 Reconciliation Module
Compare expected vs actual revenue
Flag discrepancies
🔹 Receipt Generator
PDF receipt
QR verification code
Digital signature
🔹 Audit Trail
Who edited what?
When?
From which device?
🔹 Analytics Dashboard
Revenue per department
Monthly growth
Top revenue items
Average transaction value
6️⃣ SYSTEM ARCHITECTURE RECOMMENDATION
Frontend:
Flutter (Mobile)
React (Admin Web Portal)
Backend:
Node.js / Laravel
REST API
JWT authentication
Database:
PostgreSQL
Hosting:
AWS / Azure / Local Government Data Center
7️⃣ MONETIZATION MODEL (If You’re Building This as a Product)
If this is a product like SwiftRev:
You can charge:
Per hospital license
Per transaction fee
Annual maintenance fee
Cloud hosting fee
8️⃣ SCALABILITY CONSIDERATIONS
Must handle:
Multiple hospitals
Multiple departments
Thousands of transactions daily
Therefore:
Use indexed database columns
Use load balancing
Use caching (Redis)
9️⃣ RISKS & CONTROLS
Risk
Control
Duplicate transactions
Unique transaction reference
Fraud
Audit log + Role restriction
Internet downtime
Offline sync system
Revenue leak
Daily reconciliation
   SYSTEM FLOW SUMMARY
User logs in
↓
Selects New Payment
↓
Selects Revenue Item
↓
Enters Payer Info
↓
Processes Payment
↓
Transaction saved
↓
Wallet updated
↓
Receipt generated
↓
Dashboard updates
FINAL THOUGHT
What you showed is not just a payment app.
It is a:
Hospital Enterprise Revenue Management System (HERMS)
If properly built, it can scale across:
Federal Hospitals
State Hospitals
Teaching Hospitals
Private Clinics


For complete setup of the web platform

1️⃣ Core System Architecture (Database Level)
We’ll divide tables into 6 groups:
User & Role Management
Hospital Structure
Revenue & Transactions
Wallet & Balances
Refunds & Adjustments
Logs & Audit Trail
1️⃣ USER & ROLE MANAGEMENT
     roles
Stores system roles.
Sql
Copy code
roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Example values:
Super Admin
Finance Admin
Hospital Admin
Agent
Auditor
     users
Sql
Copy code
users (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id),
    hospital_id INT REFERENCES hospitals(id),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Important:
Agents must belong to hospital
Super admin hospital_id can be NULL
2️⃣ HOSPITAL STRUCTURE
  hospitals
Sql
Copy code
hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE,
    address TEXT,
    state VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
   departments
Radiology, Lab, Pharmacy, etc.
Sql
Copy code
departments (
    id SERIAL PRIMARY KEY,
    hospital_id INT REFERENCES hospitals(id),
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
3️⃣ REVENUE & TRANSACTIONS (MOST IMPORTANT)
     transactions
This is the backbone of the system.
Sql
Copy code
transactions (
    id SERIAL PRIMARY KEY,
    transaction_ref VARCHAR(50) UNIQUE NOT NULL,
    hospital_id INT REFERENCES hospitals(id),
    department_id INT REFERENCES departments(id),
    agent_id INT REFERENCES users(id),
    approved_by INT REFERENCES users(id),
    
    patient_name VARCHAR(200),
    payment_method VARCHAR(50), -- CASH, POS, TRANSFER
    
    amount DECIMAL(15,2) NOT NULL,
    service_charge DECIMAL(15,2) DEFAULT 0.00,
    net_amount DECIMAL(15,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    
    transaction_date DATE NOT NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Important logic:
NEVER delete transactions
If mistake → reverse via refund table
4️⃣ WALLET SYSTEM
Instead of storing balance directly, compute from transactions.
But for performance, we can maintain summary wallet.
     hospital_wallets
Sql
Copy code
hospital_wallets (
    id SERIAL PRIMARY KEY,
    hospital_id INT UNIQUE REFERENCES hospitals(id),
    total_balance DECIMAL(15,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Update this only when transaction is approved.

5️⃣ REFUNDS & REVERSALS
    refunds
Sql
Copy code
refunds (
    id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id),
    approved_by INT REFERENCES users(id),
    reason TEXT,
    refund_amount DECIMAL(15,2) NOT NULL,
    refund_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Refund reduces wallet balance.
Never modify original transaction.
6️⃣ AUDIT TRAIL (VERY CRITICAL)
Every action must be logged.
    audit_logs
Sql
Copy code
audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(200),
    table_name VARCHAR(100),
    record_id INT,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Example actions:
Created transaction
Approved transaction
Issued refund
Updated hospital
Logged in
This protects you during disputes.
7️⃣ REPORTING OPTIMIZATION TABLE (Optional but Powerful)
For fast dashboard loading.
     daily_revenue_summary
Sql
Copy code
daily_revenue_summary (
    id SERIAL PRIMARY KEY,
    hospital_id INT REFERENCES hospitals(id),
    department_id INT REFERENCES departments(id),
    date DATE,
    total_transactions INT,
    total_amount DECIMAL(15,2),
    total_refunds DECIMAL(15,2),
    net_revenue DECIMAL(15,2)
);
You generate this nightly using cron job.
This makes dashboard super fast.
        Dashboard Queries Example
Revenue Today:
Sql
Copy code
SELECT SUM(net_amount)
FROM transactions
WHERE status = 'APPROVED'
AND transaction_date = CURRENT_DATE;
Revenue This Month:
Sql
Copy code
SELECT SUM(net_amount)
FROM transactions
WHERE status = 'APPROVED'
AND DATE_TRUNC('month', transaction_date) =
      DATE_TRUNC('month', CU RRENT_DATE);
⚠ Financial Safety Rules
Never:
❌ Allow UPDATE on amount after approval
❌ Allow DELETE on transaction
❌ Allow direct wallet editing
Always:
✔ Use refund table
✔ Log every action
✔ Timestamp everything
✔ Use transaction_ref unique
   Full Table List Summary
roles
users
hospitals
departments
transactions
refunds
hospital_wallets
audit_logs
daily_revenue_summary


	

 

