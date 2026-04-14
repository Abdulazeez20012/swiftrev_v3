const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUsers() {
    // 1. Get the first hospital ID
    const { data: hospitals, error: hError } = await supabase
        .from('hospitals')
        .select('id')
        .limit(1);

    if (hError || !hospitals || hospitals.length === 0) {
        console.error('No hospitals found to link users to');
        return;
    }

    const defaultHospitalId = hospitals[0].id;
    console.log(`Using default hospital ID: ${defaultHospitalId}`);

    // 2. Find users with null hospital_id and not super_admin
    const { data: users, error: uError } = await supabase
        .from('users')
        .select('id, email, role_id, roles(name)')
        .is('hospital_id', null);

    if (uError) {
        console.error('Error fetching orphan users:', uError.message);
        return;
    }

    const orphans = users.filter(u => u.roles?.name !== 'super_admin');
    console.log(`Found ${orphans.length} orphan users to fix.`);

    for (const user of orphans) {
        console.log(`Linking user ${user.email} to hospital...`);
        const { error: patchError } = await supabase
            .from('users')
            .update({ hospital_id: defaultHospitalId })
            .eq('id', user.id);
        
        if (patchError) {
            console.error(`Failed to link ${user.email}:`, patchError.message);
        } else {
            console.log(`Successfully linked ${user.email}`);
        }
    }
}

fixUsers();
