const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPermissions() {
    const { data: roles, error } = await supabase.from('roles').select('name, permissions');
    console.log('Roles & Permissions:', JSON.stringify(roles, null, 2));
}

checkPermissions();
