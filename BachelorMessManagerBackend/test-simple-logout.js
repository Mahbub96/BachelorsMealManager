const fetch = require('node-fetch');

// Use environment variables for security
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@mess.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123';

async function testLogout() {
  try {
    console.log('🧪 Testing logout functionality...');
    console.log(`📍 API Base URL: ${API_BASE_URL}`);

    // Test 1: Health check
    console.log('\n1️⃣ Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (healthResponse.ok) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed');
      return;
    }

    // Test 2: Login to get token
    console.log('\n2️⃣ Testing login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }

    const authData = await loginResponse.json();
    if (!authData.success) {
      console.log('❌ Login response indicates failure');
      return;
    }

    const token = authData.data.token;
    console.log('Token received:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('❌ No token received from login');
      return;
    }

    // Test 3: Logout
    console.log('\n3️⃣ Testing logout...');
    const logoutResponse = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Logout response status:', logoutResponse.status);

    if (logoutResponse.ok) {
      const logoutData = await logoutResponse.json();
      console.log('✅ Logout successful');
      console.log('Response:', logoutData);
    } else {
      console.log('❌ Logout failed');
      const errorData = await logoutResponse.text();
      console.log('Error response:', errorData);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testLogout();
