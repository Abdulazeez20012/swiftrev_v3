const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPayersSchema() {
    console.log('Fetching payers table columns...');
    const { data, error } = await supabase.from('payers').select('*').limit(1);

    if (error) {
        console.error('Error fetching payers:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No data in payers table.');
    }
}

checkPayersSchema();
