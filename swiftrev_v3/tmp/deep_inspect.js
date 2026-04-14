const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepInspect(email) {
    console.log(`Deep Inspecting: ${email}`);
    const { data: user, error } = await supabase
        .from('users')
        .select('*, roles(*)')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log('User Record:', JSON.stringify(user, null, 2));
}

deepInspect('admin@swiftrev.com');
