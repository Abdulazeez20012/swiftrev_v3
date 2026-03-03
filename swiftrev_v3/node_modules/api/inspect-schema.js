
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('🔍 Inspecting transactions table columns...');

    // We can try to get one row and check the type of the 'id' field if possible,
    // but a better way is to use a clever query or just try to insert/select with types.
    // However, Supabase/PostgREST doesn't directly expose column types easily without RPC.
    // Let's try to fetch one record if exists.

    const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching from transactions:', error.message);
    } else if (data && data.length > 0) {
        const id = data[0].id;
        console.log(`✅ Sample ID from transactions: "${id}" (Type: ${typeof id})`);
        // Check if it's a valid UUID string
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
            console.log('ℹ️ The ID looks like a UUID string.');
        } else {
            console.log('ℹ️ The ID DOES NOT look like a UUID.');
        }
    } else {
        console.log('ℹ️ No records found in transactions to inspect.');
    }

    console.log('🔍 Inspecting wallets table columns...');
    const { data: wData, error: wError } = await supabase
        .from('wallets')
        .select('id')
        .limit(1);

    if (wError) {
        console.error('❌ Error fetching from wallets:', wError.message);
    } else if (wData && wData.length > 0) {
        console.log(`✅ Sample ID from wallets: "${wData[0].id}" (Type: ${typeof wData[0].id})`);
    }
}

inspectSchema();
