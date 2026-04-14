const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const API_URL = 'http://localhost:3000';

async function testDepartments() {
    try {
        console.log('--- Logging in ---');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@swiftrev.com',
            password: 'password123' // Default password from setup
        });

        const { access_token, user } = loginRes.data;
        console.log('Login Success. User:', JSON.stringify(user, null, 2));

        console.log('\n--- Fetching Departments ---');
        const deptRes = await axios.get(`${API_URL}/departments?hospitalId=${user.hospitalId}`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        console.log('Departments Result:', JSON.stringify(deptRes.data, null, 2));
        console.log('Count:', deptRes.data.length);

    } catch (err) {
        console.error('Test Failed:', err.response?.data || err.message);
    }
}

testDepartments();
