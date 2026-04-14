import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email: string) {
    console.log(`Checking user: ${email}`);
    const { data, error } = await supabase
        .from('users')
        .select('*, roles(name)')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching user:', error.message);
    } else {
        console.log('User Data:', JSON.stringify(data, null, 2));
    }
}

const targetEmail = process.argv[2] || 'admin@swiftrev.com';
checkUser(targetEmail);
