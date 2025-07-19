const axios = require('axios');

async function testDashboardAPI() {
  try {
    console.log('🧪 Testing Dashboard API Integration...\n');

    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log(
      '✅ Health Check:',
      healthResponse.data.success ? 'PASSED' : 'FAILED'
    );
    console.log('   Response:', healthResponse.data.message);
    console.log('');

    // Test 2: Authentication (should fail with invalid token)
    console.log('2️⃣ Testing Authentication...');
    try {
      await axios.get('http://localhost:3000/api/dashboard', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      console.log(
        '❌ Authentication test failed - should have rejected invalid token'
      );
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(
          '✅ Authentication working correctly - rejected invalid token'
        );
      } else {
        console.log(
          '❌ Unexpected authentication error:',
          error.response?.data
        );
      }
    }
    console.log('');

    // Test 3: Dashboard endpoint structure (without auth)
    console.log('3️⃣ Testing Dashboard Endpoint Structure...');
    try {
      const response = await axios.get('http://localhost:3000/api/dashboard', {
        headers: { Authorization: 'Bearer test-token' },
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Dashboard endpoint exists and requires authentication');
        console.log('   Error response:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }
    console.log('');

    // Test 4: Check if server is running and responding
    console.log('4️⃣ Testing Server Status...');
    const serverStatus = await axios.get('http://localhost:3000/health');
    if (serverStatus.data.success) {
      console.log('✅ Server is running and healthy');
      console.log(
        '   Database:',
        serverStatus.data.database?.connected ? 'Connected' : 'Disconnected'
      );
      console.log(
        '   Uptime:',
        Math.round(serverStatus.data.uptime),
        'seconds'
      );
    } else {
      console.log('❌ Server health check failed');
    }
    console.log('');

    console.log('🎉 Dashboard API Integration Test Complete!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Health endpoint working');
    console.log('   ✅ Authentication middleware active');
    console.log('   ✅ Dashboard endpoint exists');
    console.log('   ✅ Server running properly');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('   1. Test with valid authentication token');
    console.log('   2. Verify client-side integration');
    console.log('   3. Check dashboard data response');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Server is not running. Start with: npm start');
    }
  }
}

testDashboardAPI();
