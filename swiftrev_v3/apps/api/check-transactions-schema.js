const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('--- Transactions Table Check ---');
    // We try to get the first row, including all potential columns
    const { data, error } = await supabase.from('transactions').select('*').limit(1);

    if (error) {
        console.error('Error selecting transactions:', error);
    } else if (data && data.length > 0) {
        console.log('Columns found in transactions:', Object.keys(data[0]));
    } else {
        console.log('No data in transactions table.');
        // Try to insert a record with just the required fields to see if it works and what columns we have
        // But we don't know the required fields yet.
    }

    // Try a broad request to see what columns exist in the response headers or metadata if possible
    // Supabase JS doesn't give us much metadata, but we can try to "update" a non-existent ID
    const { error: patchError } = await supabase
        .from('transactions')
        .update({ latitude: 0, longitude: 0 })
        .eq('id', '00000000-0000-0000-0000-000000000000');

    if (patchError) {
        if (patchError.message.includes('column "latitude" does not exist')) {
            console.log('❌ "latitude" column is MISSING.');
        } else if (patchError.code === 'PGRST116') {
            // PGRST116 is usually "no rows affected" which implies the column MIGHT exist
            console.log('✅ Columns "latitude" and "longitude" seem to EXIST (or at least didn\'t cause a syntax error).');
        } else {
            console.log('Update attempt error:', patchError.message);
        }
    } else {
        console.log('✅ Update attempt successful (no error), columns likely exist.');
    }
}

checkSchema();
