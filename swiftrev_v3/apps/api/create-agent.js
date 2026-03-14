const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createAgent() {
    // 1. Get agent role id
    const { data: role } = await supabase.from('roles').select('id').eq('name', 'field_agent').single();
    if (!role) {
        console.error('Field agent role not found');
        return;
    }

    // 2. Get a hospital id
    const { data: hospital } = await supabase.from('hospitals').select('id').limit(1).single();
    if (!hospital) {
        console.error('No hospital found');
        return;
    }

    const email = 'agent@swiftrev.com';
    const passwordHash = '$2a$10$7R9rRj.U2K9iA.5lV6S9Se7R9rRj.U2K9iA.5lV6S9Se7R9rRj.U2K9iA.5lV6S9Se'; // password123

    const { data, error } = await supabase.from('users').insert([{
        email,
        password_hash: passwordHash,
        role_id: role.id,
        hospital_id: hospital.id,
        full_name: 'Test Agent'
    }]).select();

    if (error) {
        console.error('Error creating agent:', error);
    } else {
        console.log('Agent created successfully:', data);
    }
}

createAgent();
