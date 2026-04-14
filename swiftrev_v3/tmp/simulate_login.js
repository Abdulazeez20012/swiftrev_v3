const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateLogin() {
    const email = 'admin@swiftrev.com';
    const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*, roles(name, permissions)')
        .eq('email', email)
        .single();

    if (dbError) {
        console.error('Error:', dbError.message);
        return;
    }

    console.log('User roles property type:', typeof user.roles);
    console.log('Is Array?', Array.isArray(user.roles));
    console.log('User roles value:', JSON.stringify(user.roles, null, 2));
    
    const roleName = user.roles?.name;
    console.log('Inferred role name:', roleName);
}

simulateLogin();
