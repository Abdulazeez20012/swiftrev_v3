
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hrtxpwmejgladudcvvai.supabase.co';
const supabaseKey = 'sb_secret_5kg--OrrXwqrEu4tMTPQPA_WKuhAtPS';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    let output = '';
    try {
        const { data: users, error: userError } = await supabase.from('users').select('email, full_name');
        if (userError) throw userError;
        
        output += '--- USERS TABLE ---\n';
        if (users.length === 0) output += 'Empty\n';
        users.forEach(u => {
            output += `Email: ${u.email} | Name: ${u.full_name}\n`;
        });

        const { data: roles, error: roleError } = await supabase.from('roles').select('name');
        if (roleError) throw roleError;

        output += '\n--- ROLES TABLE ---\n';
        roles.forEach(r => {
            output += `Role: ${r.name}\n`;
        });

    } catch (err) {
        output += `DIAGNOSTIC FAILED: ${err.message}\n`;
    }
    fs.writeFileSync('diag_output.txt', output);
    console.log('Diagnostic written to diag_output.txt');
}

checkUsers();
