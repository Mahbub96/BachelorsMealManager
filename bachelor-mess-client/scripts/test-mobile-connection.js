const axios = require('axios');

const API_URL = 'http://192.168.0.130:3000';

async function testMobileConnection() {
  console.log('🔍 Testing Mobile Connection...');
  console.log('🔧 API URL:', API_URL);

  try {
    // Test 1: Basic connectivity
    console.log('\n1️⃣ Testing basic connectivity...');
    const healthResponse = await axios.get(`${API_URL}/health`, {
      timeout: 10000,
    });
    console.log('✅ Health check successful:', healthResponse.data.success);

    // Test 2: API docs
    console.log('\n2️⃣ Testing API docs...');
    const docsResponse = await axios.get(`${API_URL}/api/docs`, {
      timeout: 10000,
    });
    console.log('✅ API docs successful:', docsResponse.data.success);

    // Test 3: Auth endpoint
    console.log('\n3️⃣ Testing auth endpoint...');
    const authResponse = await axios.post(
      `${API_URL}/api/auth/login`,
      {
        email: 'apitest2@test.com',
        password: 'Test123',
      },
      {
        timeout: 10000,
      }
    );
    console.log('✅ Auth endpoint successful:', authResponse.data.success);

    console.log('\n🎉 All tests passed! The API is accessible.');
    console.log("📱 If you're still getting network errors, check:");
    console.log('   - Both devices are on same WiFi network');
    console.log('   - No firewall blocking port 3000');
    console.log("   - Try using your computer's IP address");
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }

    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if both devices are on same WiFi network');
    console.log('2. Try pinging 192.168.0.130 from your mobile device');
    console.log('3. Check if port 3000 is open on your computer');
    console.log('4. Try using a different port or IP address');
  }
}

testMobileConnection();
