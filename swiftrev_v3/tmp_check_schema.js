
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hrtxpwmejgladudcvvai.supabase.co';
const supabaseKey = 'sb_secret_5kg--OrrXwqrEu4tMTPQPA_WKuhAtPS';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    let output = '';
    try {
        // We can't list columns directly easily, but we can try to select one row
        const { data: hosp, error: hospErr } = await supabase.from('hospitals').select('*').limit(1);
        output += '--- HOSPITALS COLUMNS ---\n';
        if (hosp && hosp.length > 0) {
            output += Object.keys(hosp[0]).join(', ') + '\n';
        } else if (hospErr) {
            output += `Error: ${hospErr.message}\n`;
        }

        const { data: wall, error: wallErr } = await supabase.from('wallets').select('*').limit(1);
        output += '\n--- WALLETS COLUMNS ---\n';
        if (wall && wall.length > 0) {
            output += Object.keys(wall[0]).join(', ') + '\n';
        } else if (wallErr) {
            output += `Error: ${wallErr.message}\n`;
        }

    } catch (err) {
        output += `DIAGNOSTIC FAILED: ${err.message}\n`;
    }
    fs.writeFileSync('schema_output.txt', output);
    console.log('Schema info written to schema_output.txt');
}

checkSchema();
