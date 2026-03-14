const axios = require('axios');

async function testRoles() {
    try {
        // We need a token. I'll try to use a known one or simulate a request if I can.
        // Actually, I'll just check if the endpoint exists by calling it without auth first to see 401 vs 404.
        const res = await axios.get('http://localhost:3000/users/roles');
        console.log('Response:', res.status);
    } catch (err) {
        console.log('Error Status:', err.response?.status);
        console.log('Error Data:', err.response?.data);
    }
}

testRoles();
