
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('🔍 Listing all tables in public schema...');

    // Querying pg_catalog to see what actually exists
    const { data, error } = await supabase
        .rpc('get_tables'); // This might not exist, fallback to raw query

    if (error) {
        // Fallback: Try a generic query to see if we can at least reach it
        const { data: tables, error: sqlError } = await supabase
            .from('transactions')
            .select('*')
            .limit(0);

        if (sqlError) {
            console.log('❌ Transactions table does not seem to respond normally or missing.');
            console.error(sqlError.message);
        } else {
            console.log('✅ Transactions table exists.');
        }

        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .limit(0);

        if (userError) {
            console.log('❌ Users table does not seem to respond normally or missing.');
        } else {
            console.log('✅ Users table exists.');
        }
    } else {
        console.log('Tables found:', data);
    }
}

listTables();
