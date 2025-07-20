const axios = require('axios');

const API_URL = 'http://192.168.0.130:3000';

async function testLoginFlow() {
  console.log('🔍 Testing Login Flow...');
  console.log('🔧 API URL:', API_URL);

  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check successful:', healthResponse.data.success);

    // Test 2: Login with correct credentials
    console.log('\n2️⃣ Testing login with correct credentials...');
    const loginResponse = await axios.post(
      `${API_URL}/api/auth/login`,
      {
        email: 'mahbub@mess.com',
        password: 'Password123',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Login successful:', {
      success: loginResponse.data.success,
      hasToken: !!loginResponse.data.data?.token,
      hasUser: !!loginResponse.data.data?.user,
      userRole: loginResponse.data.data?.user?.role,
      userName: loginResponse.data.data?.user?.name,
    });

    // Test 3: Login with wrong credentials
    console.log('\n3️⃣ Testing login with wrong credentials...');
    try {
      const wrongLoginResponse = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: 'mahbub@mess.com',
          password: 'WrongPassword',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('❌ Should have failed but got:', wrongLoginResponse.data);
    } catch (error) {
      console.log(
        '✅ Correctly failed with wrong password:',
        error.response?.data?.message
      );
    }

    // Test 4: Test with member user
    console.log('\n4️⃣ Testing login with member user...');
    const memberLoginResponse = await axios.post(
      `${API_URL}/api/auth/login`,
      {
        email: 'rahim@mess.com',
        password: 'Password123',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Member login successful:', {
      success: memberLoginResponse.data.success,
      hasToken: !!memberLoginResponse.data.data?.token,
      hasUser: !!memberLoginResponse.data.data?.user,
      userRole: memberLoginResponse.data.data?.user?.role,
      userName: memberLoginResponse.data.data?.user?.name,
    });

    console.log('\n🎉 All login tests passed!');
    console.log('📱 Now test the mobile app with these credentials:');
    console.log('   Admin: mahbub@mess.com / Password123');
    console.log('   Member: rahim@mess.com / Password123');
  } catch (error) {
    console.error('❌ Login flow test failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }
  }
}

testLoginFlow();
