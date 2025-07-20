const axios = require('axios');

const API_URL = 'http://192.168.0.130:3000';

async function testClientLoginFlow() {
  console.log('🔍 Testing Client Login Flow...');
  console.log('🔧 API URL:', API_URL);

  try {
    // Test 1: Simulate the exact login request the client makes
    console.log('\n1️⃣ Testing client login request...');
    const loginData = {
      email: 'mahbub@mess.com',
      password: 'Password123',
    };

    console.log('📤 Sending login data:', loginData);

    const response = await axios.post(`${API_URL}/api/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
    });

    console.log('📥 Response received:', {
      status: response.status,
      success: response.data.success,
      hasData: !!response.data.data,
      hasToken: !!response.data.data?.token,
      hasUser: !!response.data.data?.user,
      userRole: response.data.data?.user?.role,
      userName: response.data.data?.user?.name,
    });

    if (response.data.success && response.data.data) {
      console.log('✅ Login successful!');
      console.log(
        '🔑 Token received:',
        response.data.data.token ? 'Yes' : 'No'
      );
      console.log(
        '👤 User data received:',
        response.data.data.user ? 'Yes' : 'No'
      );

      // Test 2: Verify the response structure matches what client expects
      console.log('\n2️⃣ Verifying response structure...');
      const expectedFields = ['token', 'user'];
      const dataFields = Object.keys(response.data.data);

      console.log('📋 Expected fields:', expectedFields);
      console.log('📋 Actual fields:', dataFields);

      const missingFields = expectedFields.filter(
        field => !dataFields.includes(field)
      );
      if (missingFields.length > 0) {
        console.log('❌ Missing fields:', missingFields);
      } else {
        console.log('✅ All expected fields present');
      }

      // Test 3: Verify user object structure
      console.log('\n3️⃣ Verifying user object structure...');
      const user = response.data.data.user;
      const userFields = ['id', 'name', 'email', 'role', 'status'];
      const actualUserFields = Object.keys(user);

      console.log('📋 Expected user fields:', userFields);
      console.log('📋 Actual user fields:', actualUserFields);

      const missingUserFields = userFields.filter(
        field => !actualUserFields.includes(field)
      );
      if (missingUserFields.length > 0) {
        console.log('❌ Missing user fields:', missingUserFields);
      } else {
        console.log('✅ All expected user fields present');
      }
    } else {
      console.log(
        '❌ Login failed:',
        response.data.message || response.data.error
      );
    }

    console.log('\n🎉 Client login flow test completed!');
    console.log('📱 The mobile app should work with these credentials:');
    console.log('   Email: mahbub@mess.com');
    console.log('   Password: Password123');
  } catch (error) {
    console.error('❌ Client login flow test failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the mobile device can reach 192.168.0.130:3000');
    console.log('2. Verify the API server is running');
    console.log('3. Check network connectivity between device and computer');
  }
}

testClientLoginFlow();
