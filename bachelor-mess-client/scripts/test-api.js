const axios = require('axios');

// Test configuration
const baseUrl = 'http://localhost:3000';

async function testApiConnection() {
  console.log('🧪 Testing API connection...');
  console.log(`🔗 Testing URL: ${baseUrl}/health`);

  try {
    const response = await axios.get(`${baseUrl}/health`, {
      timeout: 5000,
    });

    if (response.status === 200) {
      const data = response.data;
      console.log('✅ API is running and accessible!');
      console.log('📊 Health check response:', data);
      return true;
    } else {
      console.error('❌ API responded with error status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to API:', error.message);
    console.log('💡 Make sure the backend server is running on port 3000');
    console.log('💡 Run: cd BachelorMessManagerBackend && npm start');
    return false;
  }
}

async function testUserStatsEndpoint() {
  const baseUrl = 'http://localhost:3000/api';

  console.log('\n🧪 Testing user stats endpoint...');
  console.log(`🔗 Testing URL: ${baseUrl}/user-stats/dashboard`);

  try {
    const response = await axios.get(`${baseUrl}/user-stats/dashboard`, {
      headers: {
        Authorization: 'Bearer test-token', // This will fail auth but we can see if endpoint exists
      },
      timeout: 5000,
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', response.headers);

    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires authentication (expected)');
      return true;
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found');
      return false;
    } else {
      console.log('📊 Unexpected response:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to test user stats endpoint:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting API connection tests...\n');

  const healthCheck = await testApiConnection();

  if (healthCheck) {
    await testUserStatsEndpoint();
  }

  console.log('\n🏁 API connection tests completed!');
}

main().catch(console.error);
