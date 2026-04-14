const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Simple CLI argument parser
const args = process.argv.slice(2);
const emailArg = args.find(a => a.startsWith('--email='))?.split('=')[1] || args[args.indexOf('--email') + 1];
const passwordArg = args.find(a => a.startsWith('--password='))?.split('=')[1] || args[args.indexOf('--password') + 1];

if (!emailArg || !passwordArg) {
    console.log('Usage: node reset-password.js --email <email> --password <new-password>');
    process.exit(1);
}

async function resetPassword() {
    console.log(`🔍 Attempting to reset password for: ${emailArg}`);
    console.log(`🔗 Connecting to: ${supabaseUrl}`);

    try {
        // 1. Get user ID from email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
            throw new Error(`Failed to list users: ${listError.message}`);
        }

        const user = users.find(u => u.email.toLowerCase() === emailArg.toLowerCase());

        if (!user) {
            console.error(`❌ Error: User with email "${emailArg}" not found in Supabase Auth.`);
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.id}`);

        // 2. Update password
        const { data, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            password: passwordArg
        });

        if (updateError) {
            throw new Error(`Failed to update password: ${updateError.message}`);
        }

        console.log(`🚀 Successfully reset password for ${emailArg}!`);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('fetch failed')) {
            console.log('\n💡 Tip: It looks like the Supabase server is unreachable.');
            console.log('If you are developing locally, make sure your local Supabase instance is running.');
            console.log('Run: npx supabase start (if you have the CLI installed)');
        }
        process.exit(1);
    }
}

resetPassword();
