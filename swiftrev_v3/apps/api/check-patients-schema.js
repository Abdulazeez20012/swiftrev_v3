const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPatientsSchema() {
    console.log('Fetching patients table columns...');
    const { data, error } = await supabase.from('patients').select('*').limit(1);

    if (error) {
        console.error('Error fetching patients:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No data in patients table, trying to fetch schema via RPC or introspection...');
        // Fallback: try to insert a dummy record (it might fail but will show columns)
        const { error: insertError } = await supabase.from('patients').insert({}).select();
        console.log('Insert attempt error (reveals schema issues):', insertError?.message);
    }
}

checkPatientsSchema();
