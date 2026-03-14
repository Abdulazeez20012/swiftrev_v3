const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPatients() {
    console.log('Fetching registered patients...');
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching patients:', error);
        return;
    }

    console.log(`Found ${data.length} patients.`);
    data.forEach(p => {
        console.log(`- ${p.full_name} (${p.phone_number}) registered at ${p.created_at}`);
    });
}

checkPatients();
