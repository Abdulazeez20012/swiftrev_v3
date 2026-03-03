
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const email = 'admintest@swiftrev.com';
    console.log(`🔍 Testing query for: ${email}`);

    const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*, roles(name, permissions)')
        .eq('email', email)
        .single();

    if (dbError) {
        console.error('❌ Query failed:', dbError.message);
        console.error('Full error:', JSON.stringify(dbError, null, 2));

        console.log('\n🔍 Retrying without roles join...');
        const { data: basicUser, error: basicError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (basicError) {
            console.error('❌ Basic query failed too:', basicError.message);
        } else {
            console.log('✅ Basic query succeeded. Problem is in the join.');
        }
    } else {
        console.log('✅ Query succeeded!');
        console.log('User:', JSON.stringify(user, null, 2));
    }
}

testQuery();
