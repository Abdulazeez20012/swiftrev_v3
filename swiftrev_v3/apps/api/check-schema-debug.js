const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    const { data: transCols, error: e1 } = await supabase.rpc('get_table_info', { table_name: 'transactions' });
    const { data: mlCols, error: e2 } = await supabase.rpc('get_table_info', { table_name: 'ml_predictions' });

    // If rpc doesn't work, try a direct query to information_schema if possible or just select 1
    if (e1 || e2) {
        console.log('RPC failed, trying direct select');
        const { data: t } = await supabase.from('transactions').select('*').limit(1);
        const { data: m } = await supabase.from('ml_predictions').select('*').limit(1);
        console.log('Transactions Sample:', t ? Object.keys(t[0]) : 'None');
        console.log('ML Predictions Sample:', m ? Object.keys(m[0]) : 'None');
    }
}

checkSchema();
