const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAgentPermissions() {
    const { data: role, error } = await supabase
        .from('roles')
        .select('*')
        .eq('name', 'field_agent')
        .single();

    if (error) {
        console.error('Error fetching field_agent role:', error);
        return;
    }

    console.log('Field Agent Role:', JSON.stringify(role, null, 2));
}

checkAgentPermissions();
