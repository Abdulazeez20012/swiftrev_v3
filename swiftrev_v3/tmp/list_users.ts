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

async function listRecentUsers() {
    console.log(`Listing last 10 users:`);
    const { data, error } = await supabase
        .from('users')
        .select('*, roles(name), hospitals(name)')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching users:', error.message);
    } else {
        console.table(data?.map(u => ({
            email: u.email,
            role: u.roles?.name,
            hospital: u.hospitals?.name || 'NULL',
            hospital_id: u.hospital_id
        })));
    }
}

listRecentUsers();
