const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    const { data: users, error: userError } = await supabase.from('users').select('id, email, role_id');
    const { data: roles, error: roleError } = await supabase.from('roles').select('id, name');

    console.log('Users:', users);
    console.log('Roles:', roles);

    if (userError) console.error('User Error:', userError);
    if (roleError) console.error('Role Error:', roleError);
}

checkData();
