const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addOnboardedByColumn() {
    console.log('Adding onboarded_by column to patients table...');

    // Check if column already exists
    const { data: cols, error: colError } = await supabase.rpc('get_table_info', { table_name: 'patients' }).catch(() => ({ data: null }));

    // Direct SQL is better for schema changes
    const sql = `
        ALTER TABLE patients ADD COLUMN IF NOT EXISTS onboarded_by UUID REFERENCES users(id);
    `;

    console.log('Please run this SQL in your Supabase SQL Editor:');
    console.log(sql);
}

addOnboardedByColumn();
