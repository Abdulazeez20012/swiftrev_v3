
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log('🔍 Checking users in public.users table...');
    const { data: users, error: userError } = await supabase.from('users').select('*, roles(name)');
    if (userError) {
        console.error('❌ Error fetching users:', userError.message);
    } else {
        console.log(`✅ Found ${users.length} users in public.users:`);
        users.forEach(u => console.log(`- ${u.email} (Role: ${u.roles?.name || u.role_id})`));
    }

    console.log('\n🔍 Checking roles in public.roles table...');
    const { data: roles, error: roleError } = await supabase.from('roles').select('*');
    if (roleError) {
        console.error('❌ Error fetching roles:', roleError.message);
    } else {
        console.log(`✅ Found ${roles.length} roles:`);
        roles.forEach(r => console.log(`- ${r.name} (${r.id})`));
    }

    console.log('\n🔍 Checking hospitals in public.hospitals table...');
    const { data: hospitals, error: hospError } = await supabase.from('hospitals').select('*');
    if (hospError) {
        console.error('❌ Error fetching hospitals:', hospError.message);
    } else {
        console.log(`✅ Found ${hospitals.length} hospitals:`);
        hospitals.forEach(h => console.log(`- ${h.name} (${h.id})`));
    }
}

checkUsers();
