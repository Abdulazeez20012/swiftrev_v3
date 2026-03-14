const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    console.log('Fetching table list...');
    // We can't directly list tables with the JS client without RPC, 
    // but we can try common ones and see which ones exist or error.
    const tables = ['patients', 'payers', 'users', 'hospitals', 'transactions', 'wallets', 'revenue_items', 'departments', 'roles'];
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`- ${table}: ERROR (${error.message})`);
        } else {
            console.log(`- ${table}: EXISTS`);
        }
    }
}

listTables();
