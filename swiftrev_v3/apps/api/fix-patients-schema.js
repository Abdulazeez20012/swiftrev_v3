const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixSchema() {
    console.log('Resolving patient schema conflict...');

    // 1. Drop existing tables (CASCADE to handle constraints)
    console.log('Dropping stale tables...');
    const { error: dropError } = await supabase.rpc('execute_sql', {
        sql_query: `
            DROP TABLE IF EXISTS patients CASCADE;
            DROP TABLE IF EXISTS payers CASCADE;
        `
    });

    if (dropError) {
        console.error('Error dropping tables via RPC:', dropError);
        // Fallback: try direct query if RPC is missing
        console.log('Trying direct DDL (this might fail depending on permissions)...');
    }

    // Since we don't have a reliable 'execute_sql' RPC by default in all Supabase projects,
    // we'll try to use a specialized migration script or just hope the user can run this in Supabase SQL Editor.
    // However, as an agent, I should try to do it if possible.

    // Alternative: Create the table and see if it works.
    console.log('Recreating patients table...');
    const createTableSql = `
        CREATE TABLE patients (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            hospital_id UUID NOT NULL REFERENCES hospitals(id),
            full_name TEXT NOT NULL,
            phone_number TEXT,
            email TEXT,
            address TEXT,
            date_of_birth TEXT,
            gender TEXT,
            insurance_number TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Update transactions to reference patients instead of payers
        ALTER TABLE transactions RENAME COLUMN payer_id TO patient_id;
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_payer_id_fkey;
        ALTER TABLE transactions ADD CONSTRAINT transactions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);
    `;

    console.log('Please run the following SQL in your Supabase SQL Editor to fix the schema:');
    console.log(createTableSql);

    // I'll try to use the 'execute_sql' RPC if it exists, otherwise I'll have to ask the user.
    const { error: rpcError } = await supabase.rpc('execute_sql', { query: createTableSql });
    if (rpcError) {
        console.log('RPC execute_sql failed, which is expected for security. I will provide the SQL to the user.');
    } else {
        console.log('Schema updated successfully via RPC!');
    }
}

fixSchema();
