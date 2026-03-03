
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log('🔍 Checking RLS policies for users table...');

    // We can't query pg_policies directly via PostgREST easily.
    // But we can try to query as a non-admin to see if it's blocked.
    // However, I'll just check if RLS is enabled via a raw SQL if I had it.

    // Since I can't run raw SQL, I'll try to fetch users with the SERVICE ROLE key (should work)
    // vs fetching with a regular ANON key if available.

    const { data: sData, error: sError } = await supabase.from('users').select('id');
    if (sError) {
        console.error('❌ Service role lookup failed:', sError.message);
    } else {
        console.log('✅ Service role lookup succeeded (as expected, it bypasses RLS).');
    }

    // Now the REAL test: if I use a "public" client, does it fail?
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (anonKey) {
        const publicClient = createClient(supabaseUrl, anonKey);
        const { data: pData, error: pError } = await supabase.from('users').select('id');
        if (pError) {
            console.log('ℹ️ Public client lookup failed (expected if RLS is on):', pError.message);
        } else {
            console.log('⚠️ Public client lookup succeeded! RLS might be off or too open.');
        }
    }
}

checkRLS();
