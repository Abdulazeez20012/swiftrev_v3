require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const HOSPITAL_ID = 'cb0fd515-5313-4ac2-b740-ab1e3ae7456e';

// 15 services per department (id -> services)
const servicesByDept = {

  // Pharmacy (a6a8b0f2)
  'a6a8b0f2-667a-4b28-b782-e8c7f3804677': [
    { name: 'Dispensing Fee', amount: 500 },
    { name: 'Amoxicillin 500mg (10 tabs)', amount: 800 },
    { name: 'Paracetamol 500mg (20 tabs)', amount: 400 },
    { name: 'Metformin 500mg (30 tabs)', amount: 1200 },
    { name: 'Amlodipine 5mg (30 tabs)', amount: 1500 },
    { name: 'Artemether/Lumefantrine (Coartem) 6-dose', amount: 1800 },
    { name: 'ORS Sachets (x5)', amount: 300 },
    { name: 'Zinc Sulphate Syrup 200ml', amount: 700 },
    { name: 'Metronidazole 400mg (21 tabs)', amount: 900 },
    { name: 'Omeprazole 20mg (14 caps)', amount: 1100 },
    { name: 'Lisinopril 5mg (30 tabs)', amount: 1400 },
    { name: 'Prednisolone 5mg (20 tabs)', amount: 600 },
    { name: 'Vitamin C 500mg (30 tabs)', amount: 500 },
    { name: 'Multi-vitamin Syrup 200ml', amount: 800 },
    { name: 'Insulin (Actrapid) Vial', amount: 3500 },
  ],

  // Phamarcy duplicate (f578f974) - same services
  'f578f974-a5ab-40a5-8592-2b359a3d9720': [
    { name: 'Dispensing Fee', amount: 500 },
    { name: 'Amoxicillin 500mg (10 tabs)', amount: 800 },
    { name: 'Paracetamol 500mg (20 tabs)', amount: 400 },
    { name: 'Metformin 500mg (30 tabs)', amount: 1200 },
    { name: 'Amlodipine 5mg (30 tabs)', amount: 1500 },
    { name: 'Artemether/Lumefantrine (Coartem) 6-dose', amount: 1800 },
    { name: 'ORS Sachets (x5)', amount: 300 },
    { name: 'Zinc Sulphate Syrup 200ml', amount: 700 },
    { name: 'Metronidazole 400mg (21 tabs)', amount: 900 },
    { name: 'Omeprazole 20mg (14 caps)', amount: 1100 },
    { name: 'Lisinopril 5mg (30 tabs)', amount: 1400 },
    { name: 'Prednisolone 5mg (20 tabs)', amount: 600 },
    { name: 'Vitamin C 500mg (30 tabs)', amount: 500 },
    { name: 'Multi-vitamin Syrup 200ml', amount: 800 },
    { name: 'Insulin (Actrapid) Vial', amount: 3500 },
  ],

  // Outpatient Department (OPD) (81c60a34)
  '81c60a34-de96-4b5a-b817-6c37a9f53fed': [
    { name: 'OPD Consultation Fee', amount: 2000 },
    { name: 'OPD Registration Fee', amount: 500 },
    { name: 'Follow-up Consultation', amount: 1000 },
    { name: 'Medical Certificate', amount: 1500 },
    { name: 'Blood Pressure Monitoring', amount: 500 },
    { name: 'Blood Glucose Monitoring', amount: 700 },
    { name: 'Weight / BMI Assessment', amount: 300 },
    { name: 'Wound Dressing (Minor)', amount: 1500 },
    { name: 'Injection Administration Fee', amount: 500 },
    { name: 'IV Drip Setup Fee', amount: 1000 },
    { name: 'Urinalysis (Dipstick)', amount: 800 },
    { name: 'Malaria RDT Test', amount: 1000 },
    { name: 'Typhoid Widal Test', amount: 1200 },
    { name: 'Referral Letter', amount: 500 },
    { name: 'Nebulization (Asthma)', amount: 2000 },
  ],

  // Laboratory (97662f49)
  '97662f49-f3c9-4c78-87cf-2d7f86b2625e': [
    { name: 'Full Blood Count (FBC)', amount: 2500 },
    { name: 'Malaria Parasite (MP) Test', amount: 1500 },
    { name: 'Widal Test (Typhoid)', amount: 1500 },
    { name: 'Blood Group & Genotype', amount: 2000 },
    { name: 'Fasting Blood Sugar (FBS)', amount: 1200 },
    { name: 'Random Blood Sugar (RBS)', amount: 1000 },
    { name: 'Urine Microscopy & Culture', amount: 3000 },
    { name: 'Pregnancy Test (urine)', amount: 700 },
    { name: 'HIV Screening (ELISA)', amount: 2000 },
    { name: 'Hepatitis B Surface Antigen', amount: 2500 },
    { name: 'Liver Function Test (LFT)', amount: 4500 },
    { name: 'Kidney Function Test (KFT)', amount: 4500 },
    { name: 'Lipid Profile', amount: 5000 },
    { name: 'Thyroid Function Test (TFT)', amount: 6000 },
    { name: 'Stool Microscopy & Culture', amount: 2500 },
  ],

  // Radiology (72bae313)
  '72bae313-7e1b-49d6-aa0e-b4c8c6b1053b': [
    { name: 'Chest X-Ray (PA View)', amount: 5000 },
    { name: 'Skull X-Ray', amount: 5500 },
    { name: 'Spine X-Ray (Lumbar)', amount: 6000 },
    { name: 'Abdominal X-Ray', amount: 5000 },
    { name: 'Pelvic X-Ray', amount: 5500 },
    { name: 'Upper Limb X-Ray', amount: 4500 },
    { name: 'Lower Limb X-Ray', amount: 4500 },
    { name: 'Ultrasound Scan (Abdomen)', amount: 8000 },
    { name: 'Obstetric Ultrasound Scan', amount: 8500 },
    { name: 'Pelvic Ultrasound Scan', amount: 8000 },
    { name: 'CT Scan (Brain)', amount: 45000 },
    { name: 'CT Scan (Chest)', amount: 50000 },
    { name: 'MRI (Brain)', amount: 80000 },
    { name: 'Echocardiography', amount: 25000 },
    { name: 'Doppler Ultrasound', amount: 15000 },
  ],

  // Maternity & Labour (3470be88)
  '3470be88-73d8-4bff-9199-34a7593ddfe1': [
    { name: 'Antenatal Registration', amount: 3000 },
    { name: 'Antenatal Visit (Routine)', amount: 2000 },
    { name: 'Normal Vaginal Delivery', amount: 25000 },
    { name: 'Caesarean Section (C/S)', amount: 120000 },
    { name: 'Episiotomy & Repair', amount: 10000 },
    { name: 'Postnatal Check-up', amount: 2000 },
    { name: 'Family Planning Consultation', amount: 1500 },
    { name: 'Implant Insertion (Jadelle)', amount: 8000 },
    { name: 'IUCD Insertion', amount: 5000 },
    { name: 'Partograph Monitoring', amount: 2000 },
    { name: 'Newborn Examination', amount: 3000 },
    { name: 'Cord Care Package', amount: 1500 },
    { name: 'Immunization (at birth)', amount: 2500 },
    { name: 'Vitamin K Injection', amount: 1000 },
    { name: 'Breast Milk Expression Support', amount: 1000 },
  ],

  // Surgery & Theatre (3e06e3e3)
  '3e06e3e3-2aac-4f05-ab3a-5a146cc076c9': [
    { name: 'Minor Surgery (Excision)', amount: 20000 },
    { name: 'Major Surgery (General)', amount: 150000 },
    { name: 'Appendectomy', amount: 120000 },
    { name: 'Hernia Repair', amount: 100000 },
    { name: 'Laparotomy', amount: 180000 },
    { name: 'Incision & Drainage (I&D)', amount: 15000 },
    { name: 'Wound Debridement', amount: 20000 },
    { name: 'Skin Grafting', amount: 80000 },
    { name: 'Circumcision (Adult)', amount: 15000 },
    { name: 'Circumcision (Paediatric)', amount: 10000 },
    { name: 'Theatre Consumables Fee', amount: 10000 },
    { name: 'Anaesthesia (General)', amount: 30000 },
    { name: 'Anaesthesia (Spinal)', amount: 20000 },
    { name: 'Surgical Dressing Pack', amount: 5000 },
    { name: 'Suture Removal', amount: 2000 },
  ],

  // Emergency / A&E (f8de38e4)
  'f8de38e4-6942-43a1-ba89-ab721e1cb5cd': [
    { name: 'A&E Consultation Fee', amount: 3000 },
    { name: 'Emergency Registration', amount: 1000 },
    { name: 'Resuscitation Fee', amount: 10000 },
    { name: 'IV Access & Cannulation', amount: 2000 },
    { name: 'Emergency IV Fluid (1L)', amount: 2500 },
    { name: 'Oxygen Therapy (per hour)', amount: 1500 },
    { name: 'ECG Recording', amount: 3500 },
    { name: 'Emergency Blood Transfusion Fee', amount: 15000 },
    { name: 'Fracture Splinting (Plaster)', amount: 8000 },
    { name: 'Laceration Suturing', amount: 5000 },
    { name: 'Gastric Lavage', amount: 10000 },
    { name: 'Urethral Catheterisation', amount: 4000 },
    { name: 'Nasogastric Tube (NGT) Insertion', amount: 3000 },
    { name: 'Emergency Drug Admin Fee', amount: 1000 },
    { name: 'Ambulance Transfer Fee', amount: 20000 },
  ],

  // Inpatient Wards (84a9039b)
  '84a9039b-ed7e-433a-a65d-aad5adc16bf1': [
    { name: 'Ward Admission Fee', amount: 5000 },
    { name: 'General Ward (per day)', amount: 5000 },
    { name: 'Private Ward (per day)', amount: 15000 },
    { name: 'Semi-Private Ward (per day)', amount: 10000 },
    { name: 'ICU/HDU (per day)', amount: 50000 },
    { name: 'Nursing Care Fee (per day)', amount: 3000 },
    { name: 'Vital Signs Monitoring (per day)', amount: 1000 },
    { name: 'Medication Administration (per day)', amount: 1500 },
    { name: 'IV Fluid Administration (per bag)', amount: 2000 },
    { name: 'Urinary Catheter Care (per day)', amount: 1500 },
    { name: 'Wound Dressing (Inpatient)', amount: 3000 },
    { name: 'Hospital Meal (per day)', amount: 2000 },
    { name: 'Discharge Processing Fee', amount: 2000 },
    { name: 'Physiotherapy (Ward Visit)', amount: 4000 },
    { name: 'Specialist Inpatient Review', amount: 5000 },
  ],

  // Dental Clinic (ba083888)
  'ba083888-8423-443b-80b0-f37da09eb132': [
    { name: 'Dental Consultation', amount: 2500 },
    { name: 'Dental X-Ray (Periapical)', amount: 3000 },
    { name: 'Dental Panoramic X-Ray', amount: 8000 },
    { name: 'Scaling & Polishing', amount: 5000 },
    { name: 'Tooth Extraction (Simple)', amount: 5000 },
    { name: 'Tooth Extraction (Surgical)', amount: 15000 },
    { name: 'Amalgam Filling (per tooth)', amount: 6000 },
    { name: 'Composite Filling (per tooth)', amount: 8000 },
    { name: 'Root Canal Treatment', amount: 35000 },
    { name: 'Dental Crown (Metal)', amount: 25000 },
    { name: 'Dental Crown (Porcelain)', amount: 45000 },
    { name: 'Denture (Full, per jaw)', amount: 60000 },
    { name: 'Partial Denture', amount: 35000 },
    { name: 'Teeth Whitening', amount: 20000 },
    { name: 'Orthodontic Consultation', amount: 5000 },
  ],

  // Eye Clinic / Ophthalmology (fb711a02)
  'fb711a02-5428-48d2-86e6-9b746cfc3702': [
    { name: 'Eye Consultation', amount: 2500 },
    { name: 'Visual Acuity Test', amount: 1000 },
    { name: 'Tonometry (Eye Pressure)', amount: 2000 },
    { name: 'Fundoscopy', amount: 3000 },
    { name: 'Slit Lamp Examination', amount: 3000 },
    { name: 'Prescription Glasses Assessment', amount: 2000 },
    { name: 'Glasses Dispensing Fee', amount: 1500 },
    { name: 'Contact Lens Assessment', amount: 3000 },
    { name: 'Foreign Body Removal (Eye)', amount: 5000 },
    { name: 'Chalazion Excision', amount: 15000 },
    { name: 'Cataract Surgery (one eye)', amount: 80000 },
    { name: 'Glaucoma Laser Treatment', amount: 60000 },
    { name: 'Pterygium Excision', amount: 35000 },
    { name: 'Eye Patch & Dressing', amount: 2000 },
    { name: 'Eye Fluorescein Angiography', amount: 25000 },
  ],

  // Pediatrics (50078167)
  '50078167-8974-4cce-89fd-d3d6d8b3a0a5': [
    { name: 'Paediatric Consultation', amount: 2500 },
    { name: 'Neonatal Care (per day)', amount: 8000 },
    { name: 'Child Immunisation (per dose)', amount: 1500 },
    { name: 'Growth Monitoring', amount: 500 },
    { name: 'Malnutrition Assessment (MUAC)', amount: 700 },
    { name: 'Oral Rehydration Therapy', amount: 1000 },
    { name: 'Vitamin A Supplementation', amount: 500 },
    { name: 'Deworming (Albendazole)', amount: 500 },
    { name: 'Febrile Convulsion Management', amount: 5000 },
    { name: 'Paediatric IV Fluid (per bag)', amount: 2000 },
    { name: 'Neonatal Phototherapy (per day)', amount: 5000 },
    { name: 'Paediatric Bronchodilator Therapy', amount: 3000 },
    { name: 'Well-Child Check (0-12 months)', amount: 2000 },
    { name: 'Well-Child Check (1-5 years)', amount: 1500 },
    { name: 'Child Development Screening', amount: 3000 },
  ],

  // Physiotherapy (64a84f0e)
  '64a84f0e-3833-4dc7-8d67-184b61b74d37': [
    { name: 'Physiotherapy Consultation', amount: 3000 },
    { name: 'Electrotherapy (per session)', amount: 3500 },
    { name: 'Heat Therapy (Hot Pack)', amount: 2000 },
    { name: 'Cold Therapy (Ice Pack)', amount: 1500 },
    { name: 'Ultrasound Therapy (per session)', amount: 4000 },
    { name: 'TENS Therapy (per session)', amount: 3000 },
    { name: 'Traction Therapy (Cervical)', amount: 4000 },
    { name: 'Traction Therapy (Lumbar)', amount: 4000 },
    { name: 'Exercise Therapy (per session)', amount: 3000 },
    { name: 'Post-Surgical Rehab (per session)', amount: 5000 },
    { name: 'Stroke Rehabilitation (per session)', amount: 5000 },
    { name: 'Gait Training (per session)', amount: 4000 },
    { name: 'Manual Therapy (per session)', amount: 5000 },
    { name: 'Chest Physiotherapy', amount: 4000 },
    { name: 'Sports Injury Rehabilitation', amount: 6000 },
  ],

  // Cardiology (5e258c9a)
  '5e258c9a-02c9-4f3c-a024-16e61b607765': [
    { name: 'Cardiology Consultation', amount: 5000 },
    { name: 'ECG (12-Lead)', amount: 4000 },
    { name: 'Echocardiography', amount: 25000 },
    { name: 'Holter Monitoring (24hr)', amount: 20000 },
    { name: 'Exercise Stress Test (EST)', amount: 15000 },
    { name: 'Ambulatory Blood Pressure Monitor', amount: 12000 },
    { name: 'Cardiac Enzyme (Troponin)', amount: 8000 },
    { name: 'BNP / Pro-BNP Test', amount: 10000 },
    { name: 'Lipid Profile', amount: 5000 },
    { name: 'Doppler Echocardiography', amount: 30000 },
    { name: 'Cardiac Catheterisation Prep', amount: 50000 },
    { name: 'Pacemaker Check', amount: 15000 },
    { name: 'Cardioversion (Elective)', amount: 40000 },
    { name: 'Anti-Coagulation Clinic Visit', amount: 3000 },
    { name: 'INR Monitoring', amount: 2500 },
  ],
};

async function seedRevenueItems() {
  console.log('Starting revenue items seed...\n');
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const [deptId, services] of Object.entries(servicesByDept)) {
    // Get department name for logging
    const { data: dept } = await supabase.from('departments').select('name').eq('id', deptId).single();
    const deptName = dept?.name || deptId;
    console.log(`\n📂 Department: ${deptName}`);

    // Check which names already exist to avoid duplicates
    const { data: existing } = await supabase
      .from('revenue_items')
      .select('name')
      .eq('department_id', deptId);
    const existingNames = new Set((existing || []).map(e => e.name));

    const toInsert = services
      .filter(s => !existingNames.has(s.name))
      .map(s => ({
        hospital_id: HOSPITAL_ID,
        department_id: deptId,
        name: s.name,
        amount: s.amount,
        description: s.name,
      }));

    const skipped = services.length - toInsert.length;
    totalSkipped += skipped;

    if (toInsert.length === 0) {
      console.log(`  ⚠️  All ${services.length} items already exist, skipped.`);
      continue;
    }

    const { data, error } = await supabase.from('revenue_items').insert(toInsert).select();
    if (error) {
      console.error(`  ❌ Error inserting into ${deptName}:`, error.message);
    } else {
      console.log(`  ✅ Inserted ${data.length} items (skipped ${skipped} existing)`);
      totalInserted += data.length;
    }
  }

  console.log(`\n============================`);
  console.log(`✅ Done! Inserted: ${totalInserted} | Skipped (existing): ${totalSkipped}`);
  console.log(`============================\n`);
}

seedRevenueItems().catch(console.error);
