const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SERVICES_MAP = {
    'Phamarcy': [
        { name: 'Paracetamol 500mg', amount: 500, description: 'Basic pain relief' },
        { name: 'Amoxicillin 500mg', amount: 2500, description: 'Antibiotics' },
        { name: 'Vitamin C 1000mg', amount: 1200, description: 'Immune boost' }
    ],
    'Outpatient Department (OPD)': [
        { name: 'General Consultation', amount: 3000, description: 'Consult with internal medicine' },
        { name: 'Specialist Consultation', amount: 7500, description: 'Consult with senior specialists' }
    ],
    'Laboratory': [
        { name: 'Malaria Test (MP)', amount: 1500, description: 'Malaria rapid test' },
        { name: 'Full Blood Count (FBC)', amount: 4500, description: 'Comprehensive blood profiling' },
        { name: 'Urinalysis', amount: 2000, description: 'Basic urine screening' }
    ],
    'Radiology': [
        { name: 'Chest X-Ray', amount: 10000, description: 'Lung and heart imaging' },
        { name: 'Abdominal Ultrasound', amount: 12000, description: 'Internal organ imaging' }
    ],
    'Cardiology': [
        { name: 'ECG', amount: 5000, description: 'Heart rhythm monitoring' },
        { name: 'Echocardiogram', amount: 25000, description: 'Heart ultrasound' }
    ],
    'Surgery & Theatre': [
        { name: 'Theatre Fee (Minor)', amount: 25000, description: 'Use of operating room for minor surgery' },
        { name: 'Theatre Fee (Major)', amount: 100000, description: 'Use of operating room for major surgery' }
    ],
    'Maternity & Labour': [
        { name: 'Antenatal Registration', amount: 5000, description: 'First time pregnancy registration' },
        { name: 'Normal Delivery Package', amount: 50000, description: 'Comprehensive delivery package' }
    ],
    'Emergency / A&E': [
        { name: 'Emergency Admission', amount: 10000, description: 'Immediate emergency care' },
        { name: 'Oxygen (per hour)', amount: 3000, description: 'Medical oxygen supply' }
    ],
    'Inpatient Wards': [
        { name: 'Standard Ward Bed', amount: 5000, description: 'Nightly bed charge in standard ward' },
        { name: 'VIP Ward Bed', amount: 25000, description: 'Nightly bed charge in private suite' }
    ],
    'Dental Clinic': [
        { name: 'Dental Extraction', amount: 15000, description: 'Surgical tooth removal' },
        { name: 'Teeth Cleaning', amount: 10000, description: 'Scale and polish' }
    ],
    'Eye Clinic (Ophthalmology)': [
        { name: 'Eye Examination', amount: 4000, description: 'Comprehensive vision test' },
        { name: 'Standard Frame', amount: 15000, description: 'Hospital provided spectacle frame' }
    ],
    'Pediatrics': [
        { name: 'Child Consultation', amount: 3500, description: 'Specialized care for children' },
        { name: 'Immunization Charge', amount: 2000, description: 'Standard childhood vaccine administration' }
    ],
    'Intensive Care Unit (ICU)': [
        { name: 'ICU Maintenance', amount: 50000, description: 'Daily ICU bed and monitoring' }
    ],
    'Physiotherapy': [
        { name: 'Physiotherapy Session', amount: 7000, description: 'Physical therapy and rehab' }
    ]
};

async function seed() {
    const H_ID = 'cb0fd515-5313-4ac2-b740-ab1e3ae7456e';
    console.log(`Starting seed for Hospital: ${H_ID}`);

    const { data: depts } = await supabase.from('departments').select('id, name').eq('hospital_id', H_ID);
    if (!depts) {
        console.error('No departments found');
        return;
    }

    console.log(`Found ${depts.length} departments.`);

    // Clear existing for this hospital
    const { error: delError } = await supabase.from('revenue_items').delete().eq('hospital_id', H_ID);
    if (delError) console.warn('Delete error (might be empty):', delError.message);

    for (const dept of depts) {
        const services = SERVICES_MAP[dept.name] || [
            { name: `Service for ${dept.name}`, amount: 5000, description: 'Default service' }
        ];

        console.log(`Seeding ${services.length} services for ${dept.name}`);

        const insertData = services.map(s => ({
            hospital_id: H_ID,
            department_id: dept.id,
            name: s.name,
            description: s.description,
            amount: s.amount,
            payment_type: 'cash'
        }));

        const { error } = await supabase.from('revenue_items').insert(insertData);
        if (error) console.error(`Error for ${dept.name}:`, error.message);
    }

    console.log('Seed Complete!');
}

seed();
