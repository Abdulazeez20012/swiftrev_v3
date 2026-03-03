
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthUsers() {
    console.log('🔍 Checking Supabase Auth user status...');
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ Error listing auth users:', error.message);
    } else {
        console.log(`✅ Found ${data.users.length} auth users:`);
        data.users.forEach(u => {
            console.log(`- ${u.email}`);
            console.log(`  Confirmed at: ${u.email_confirmed_at}`);
            console.log(`  Last sign in: ${u.last_sign_in_at}`);
            console.log(`  Metadata: ${JSON.stringify(u.user_metadata)}`);
        });
    }
}

checkAuthUsers();
