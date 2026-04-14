const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SERVICES_MAP = {
    'Phamarcy': [
        { name: 'Paracetamol 500mg', amount: 500 },
        { name: 'Amoxicillin 500mg', amount: 2500 },
        { name: 'Multivitamin Syrup', amount: 1200 },
        { name: 'Disposable Syringe 5ml', amount: 150 }
    ],
    'Laboratory': [
        { name: 'Malaria Parasite Test (MP)', amount: 1500 },
        { name: 'Packed Cell Volume (PCV)', amount: 1000 },
        { name: 'Urinalysis', amount: 1200 },
        { name: 'Blood Glucose Test', amount: 2000 },
        { name: 'Full Blood Count', amount: 3500 }
    ],
    'Radiology': [
        { name: 'Chest X-Ray', amount: 5000 },
        { name: 'Abdominal Ultrasound', amount: 4500 },
        { name: 'Pelvic Ultrasound', amount: 4000 }
    ],
    'Outpatient Department (OPD)': [
        { name: 'General Consultation', amount: 2000 },
        { name: 'Specialist Consultation', amount: 5000 },
        { name: 'Follow-up Visit', amount: 1000 }
    ],
    'Cardiology': [
        { name: 'ECG', amount: 5000 },
        { name: 'Echocardiogram', amount: 15000 },
        { name: 'Stress Test', amount: 10000 }
    ],
    'Surgery & Theatre': [
        { name: 'Minor Procedure Fee', amount: 10000 },
        { name: 'Major Theater Fee', amount: 50000 },
        { name: 'Anesthesia Charges', amount: 15000 }
    ],
    'Pediatrics': [
        { name: 'Child Consultation', amount: 2500 },
        { name: 'Immunization Service', amount: 1500 }
    ],
    'Dental Clinic': [
        { name: 'Tooth Extraction', amount: 12000 },
        { name: 'Scaling & Polishing', amount: 8000 },
        { name: 'Dental X-Ray', amount: 3000 }
    ],
    'Eye Clinic (Ophthalmology)': [
        { name: 'Vision Screening', amount: 2000 },
        { name: 'Eye Pressure Test', amount: 2500 },
        { name: 'Frame & Lens Standard', amount: 15000 }
    ],
    'Maternity & Labour': [
        { name: 'Antenatal Registration', amount: 5000 },
        { name: 'Normal Delivery Package', amount: 75000 },
        { name: 'Postnatal Checkup', amount: 3000 }
    ],
    'Emergency / A&E': [
        { name: 'Emergency Consultation', amount: 5000 },
        { name: 'Oxygen Therapy (per hour)', amount: 3000 },
        { name: 'Suturing / Wound Care', amount: 7000 }
    ],
    'Inpatient Wards': [
        { name: 'General Ward Bed (per night)', amount: 5000 },
        { name: 'Private Ward Bed (per night)', amount: 15000 },
        { name: 'Nursing Care Fee', amount: 2000 }
    ],
    'Intensive Care Unit (ICU)': [
        { name: 'ICU Bed (per day)', amount: 45000 },
        { name: 'Ventilator Fee', amount: 25000 }
    ],
    'Physiotherapy': [
        { name: 'Physical Therapy Session', amount: 5000 },
        { name: 'Massage Therapy', amount: 7000 }
    ]
};

async function seedRevenueItems() {
    const hospitalId = 'cb0fd515-5313-4ac2-b740-ab1e3ae7456e';
    console.log(`Clearing existing items and seeding for Hospital: ${hospitalId}`);

    // Delete existing
    await supabase.from('revenue_items').delete().eq('hospital_id', hospitalId);

    const { data: depts, error: dError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('hospital_id', hospitalId);

    if (dError) {
        console.error('Error fetching departments:', dError);
        return;
    }

    console.log(`Found ${depts.length} departments.`);

    for (const dept of depts) {
        const services = SERVICES_MAP[dept.name] || [
            { name: `General Service for ${dept.name}`, amount: 3000 }
        ];

        console.log(`Seeding ${services.length} services for ${dept.name}...`);

        const itemsToInsert = services.map(s => ({
            hospital_id: hospitalId,
            department_id: dept.id,
            name: s.name,
            amount: s.amount,
            category: 'medical_service',
            status: 'active'
        }));

        const { error: iError } = await supabase
            .from('revenue_items')
            .insert(itemsToInsert);

        if (iError) {
            console.error(`Error inserting services for ${dept.name}:`, iError.message);
        }
    }

    console.log('Seed Complete!');
}

seedRevenueItems();
