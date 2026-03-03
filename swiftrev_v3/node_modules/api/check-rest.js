
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRest() {
    const tables = ['roles', 'hospitals', 'departments', 'revenue_items', 'payers', 'wallets', 'refunds', 'audit_logs', 'ml_predictions'];
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
            console.log(`❌ Table '${table}' missing or error: ${error.message}`);
        } else {
            console.log(`✅ Table '${table}' exists.`);
        }
    }
}

checkRest();
