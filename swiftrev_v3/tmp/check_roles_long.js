const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
    const { data: roles, error } = await supabase.from('roles').select('name');
    if (error) {
        console.error('Error fetching roles:', error.message);
        return;
    }
    console.log('Roles found in DB:');
    roles.forEach(r => console.log(`- "${r.name}" (Length: ${r.name.length})`));

    const { data: users, error: uError } = await supabase.from('users').select('email, roles(name)').limit(5);
    if (uError) {
        console.error('Error fetching users:', uError.message);
        return;
    }
    console.log('\nUsers with roles:');
    users.forEach(u => console.log(`- ${u.email}: "${u.roles?.name}"`));
}

checkRoles();
