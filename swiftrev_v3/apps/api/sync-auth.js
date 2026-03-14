const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function syncAuth() {
    const email = 'agent@swiftrev.com';
    const password = 'password123';

    console.log(`Checking if ${email} exists in Supabase Auth...`);

    // 1. Check if user exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    let authUser = users.find(u => u.email === email);

    if (!authUser) {
        console.log(`User ${email} not found in Auth. Creating...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            console.error('Error creating auth user:', createError);
            return;
        }
        authUser = newUser.user;
        console.log('Auth user created:', authUser.id);
    } else {
        console.log(`User ${email} already exists in Auth with ID: ${authUser.id}`);

        // Update password just in case
        const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
            password: password
        });
        if (updateError) console.error('Error updating password:', updateError);
        else console.log('Password updated for existing user.');
    }

    // 2. Sync with public.users
    console.log('Syncing with public.users...');
    const { data: role } = await supabase.from('roles').select('id').eq('name', 'field_agent').single();
    const { data: hospital } = await supabase.from('hospitals').select('id').limit(1).single();

    const { data: publicUser, error: publicError } = await supabase
        .from('users')
        .upsert({
            id: authUser.id,
            email: email,
            role_id: role.id,
            hospital_id: hospital.id,
            full_name: 'Test Agent',
            status: 'active'
        }, { onConflict: 'email' })
        .select();

    if (publicError) {
        console.error('Error syncing public user:', publicError);
    } else {
        console.log('Public user synced:', publicUser);
    }

    // 3. also check admin@swiftrev.com
    console.log('Checking admin@swiftrev.com...');
    let adminUser = users.find(u => u.email === 'admin@swiftrev.com');
    if (adminUser) {
        console.log('Admin user exists in Auth. Updating password to password123...');
        await supabase.auth.admin.updateUserById(adminUser.id, { password: 'password123' });
    } else {
        console.log('Admin user not found in Auth. Creating admin@swiftrev.com...');
        await supabase.auth.admin.createUser({
            email: 'admin@swiftrev.com',
            password: 'password123',
            email_confirm: true
        });
    }
}

syncAuth();
