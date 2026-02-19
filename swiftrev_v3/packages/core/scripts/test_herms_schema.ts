
import { DataService } from '../src/data/DataService';
import { MockStorage } from '../src/data/Storage';

// Mock Storage implementation for testing
class TestStorage extends MockStorage { }

async function testHERMS() {
    console.log('--- Starting HERMS Verification ---');
    const storage = new TestStorage();
    const dataService = DataService.getInstance(storage);

    // 1. Create Hospital
    console.log('\n1. Creating Hospital...');
    const hospResp = await dataService.hospitals().create({
        name: 'General Hospital Lagos',
        code: 'GHL-001',
        state: 'Lagos',
        address: '1 Broad Street'
    } as any); // using any to bypass strict type check in script if needed

    if (hospResp.error) {
        console.error('Failed to create hospital:', hospResp.error);
        return;
    }
    const hospital = hospResp.data!;
    console.log('Hospital Created:', hospital.name, `(${hospital.id})`);

    // 2. Create Department
    console.log('\n2. Creating Department...');
    const deptResp = await dataService.departments().create({
        hospital_id: hospital.id,
        name: 'Accounts'
    } as any);
    const department = deptResp.data!;
    console.log('Department Created:', department.name);

    // 3. Fund Wallet (Credit)
    console.log('\n3. Crediting Hospital Wallet...');
    const creditAmount = 5000000; // 5M
    const creditResp = await dataService.creditHospitalWallet(
        hospital.id,
        creditAmount,
        'WIRE-12345',
        'Initial Capital Injection'
    );

    if (creditResp.error) {
        console.error('Failed to credit wallet:', creditResp.error);
        return;
    }
    const wallet = creditResp.data!;
    console.log('Wallet Credited. New Balance:', wallet.total_balance);

    // 4. Record a Revenue Transaction (Patient Payment)
    console.log('\n4. Recording Patient Transaction...');
    const txResp = await dataService.transactions().create({
        transaction_ref: 'TXN-' + Date.now(),
        hospital_id: hospital.id,
        department_id: department.id,
        agent_id: 'AGENT-001', // Mock
        amount: 5000,
        service_charge: 100,
        net_amount: 4900,
        status: 'APPROVED',
        payment_method: 'POS',
        transaction_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString() // Explicitly adding created_at if needed
    } as any);

    if (txResp.error) {
        console.error('Failed to create transaction:', txResp.error);
        return;
    }
    const tx = txResp.data!;
    console.log('Transaction Recorded:', tx.transaction_ref, 'Net:', tx.net_amount);

    // 5. Verify Dashboard Data
    console.log('\n5. Verifying Dashboard Data Fetch...');
    const wallets = await dataService.wallets().getAll();
    const myWallet = wallets.data?.find(w => w.hospital_id === hospital.id);
    console.log('Verified Wallet Balance:', myWallet?.total_balance);

    const txs = await dataService.transactions().getAll();
    const myTxs = txs.data?.filter(t => t.hospital_id === hospital.id);
    console.log('Verified Transaction Count:', myTxs?.length);

    if (myWallet?.total_balance === creditAmount && myTxs?.length === 1) {
        console.log('\n--- HERMS VERIFICATION SUCCESSFUL ---');
    } else {
        console.error('\n--- HERMS VERIFICATION FAILED ---');
        console.log('Expected Balance:', creditAmount, 'Actual:', myWallet?.total_balance);
        console.log('Expected Tx Count: 1', 'Actual:', myTxs?.length);
    }
}

testHERMS().catch(console.error);
