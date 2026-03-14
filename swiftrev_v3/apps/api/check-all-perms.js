const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAllPermissions() {
    const { data: roles, error } = await supabase
        .from('roles')
        .select('*');

    if (error) {
        console.error('Error fetching roles:', error);
        return;
    }

    console.log('All Roles and Permissions:');
    roles.forEach(role => {
        console.log(`- ${role.name}:`, JSON.stringify(role.permissions, null, 2));
    });
}

checkAllPermissions();
