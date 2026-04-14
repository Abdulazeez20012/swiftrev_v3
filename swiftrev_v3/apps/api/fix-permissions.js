const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncPermissions() {
    console.log('Updating field_agent permissions...');
    const { error: e1 } = await supabase
        .from('roles')
        .update({
            permissions: {
                patients: true,
                transactions: true,
                revenue_items: ['read'],
                departments: ['read'],
                dashboard: ['read'],
            }
        })
        .eq('name', 'field_agent');
    if (e1) console.error('Error updating field_agent:', e1);
    else console.log('field_agent updated successfully.');

    console.log('Updating hospital_admin permissions...');
    const { error: e2 } = await supabase
        .from('roles')
        .update({
            permissions: {
                patients: true,
                transactions: true,
                users: true,
                hospital: true,
                revenue_items: true,
                departments: true,
                dashboard: true,
            }
        })
        .eq('name', 'hospital_admin');
    if (e2) console.error('Error updating hospital_admin:', e2);
    else console.log('hospital_admin updated successfully.');
}

syncPermissions();
