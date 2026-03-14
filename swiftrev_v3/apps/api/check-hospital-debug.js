const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkHospital() {
    const hospitalId = 'cb0fd515-5313-4ac2-b740-ab1e3ae7456e';
    const { data: hospital, error: hError } = await supabase.from('hospitals').select('*').eq('id', hospitalId).single();
    console.log('Hospital:', hospital);
    if (hError) console.error('Hospital Error:', hError);

    const { data: wallets, error: wError } = await supabase.from('wallets').select('*').eq('hospital_id', hospitalId);
    console.log('Wallets for this hospital:', wallets);
    if (wError) console.error('Wallet Error:', wError);
}

checkHospital();
