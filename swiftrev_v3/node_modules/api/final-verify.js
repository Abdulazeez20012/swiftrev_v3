
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalVerify() {
    console.log('🔍 Performing final verification of public.users table...');
    const { data: users, error } = await supabase
        .from('users')
        .select('email, role_id, roles(name)');

    if (error) {
        console.error('❌ Error checking users:', error.message);
    } else {
        console.log(`✅ Found ${users.length} users in database:`);
        users.forEach(u => console.log(`- ${u.email} (Role: ${u.roles?.name})`));
    }
}

finalVerify();
