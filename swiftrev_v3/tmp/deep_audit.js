const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDeepAudit() {
    console.log('--- USER AUDIT ---');
    const { data: users, error: uError } = await supabase
        .from('users')
        .select('id, email, hospital_id, role_id, roles(id, name, permissions)')
        .in('email', ['admin@swiftrev.com', 'agenttest@swiftrev.com']);
    
    if (uError) console.error(uError);
    else console.log(JSON.stringify(users, null, 2));

    console.log('\n--- ALL ROLES ---');
    const { data: roles } = await supabase.from('roles').select('*');
    console.table(roles.map(r => ({ id: r.id, name: r.name, hasDepts: !!r.permissions?.departments })));
}

runDeepAudit();
