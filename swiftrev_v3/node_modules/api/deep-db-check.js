
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepCheck() {
    console.log('--- DB CHECK ---');
    console.log('URL:', supabaseUrl);

    const { data: users, error: uError } = await supabase
        .from('users')
        .select('*, roles(*)');

    if (uError) {
        console.error('❌ Error fetching users:', uError.message);
    } else {
        console.log(`✅ Users in DB (${users.length}):`);
        users.forEach(u => {
            console.log(`- ${u.email} (ID: ${u.id}, Role: ${u.roles?.name})`);
        });
    }

    const { data: roles, error: rError } = await supabase.from('roles').select('*');
    if (rError) console.error('❌ Error fetching roles:', rError.message);
    else console.log(`✅ Roles in DB (${roles.length})`);

    const { data: hospitals, error: hError } = await supabase.from('hospitals').select('*');
    if (hError) console.error('❌ Error fetching hospitals:', hError.message);
    else console.log(`✅ Hospitals in DB (${hospitals.length})`);
}

deepCheck();
