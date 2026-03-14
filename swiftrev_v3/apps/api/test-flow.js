const axios = require('axios');
require('dotenv').config();

async function testFullFlow() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:3000/auth/login', {
            email: 'admin@swiftrev.com',
            password: 'password123'
        });

        const token = loginRes.data.access_token;
        console.log('Login Success. Token length:', token.length);

        console.log('Fetching roles...');
        const rolesRes = await axios.get('http://localhost:3000/users/roles', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Roles Response:', rolesRes.status);
        console.log('Roles Data:', rolesRes.data);
    } catch (err) {
        console.log('Error Status:', err.response?.status);
        console.log('Error Data:', err.response?.data);
        console.log('Error Message:', err.message);
    }
}

testFullFlow();
