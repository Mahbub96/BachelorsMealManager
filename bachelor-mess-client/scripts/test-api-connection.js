const axios = require('axios');

const API_URL = 'http://192.168.0.130:3000';

async function testApiConnection() {
  console.log('🔍 Testing API Connection...');
  console.log('🔧 API URL:', API_URL);

  try {
    // Test health endpoint
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check successful:', healthResponse.data.success);

    // Test API docs endpoint
    console.log('\n2️⃣ Testing API docs endpoint...');
    const docsResponse = await axios.get(`${API_URL}/api/docs`);
    console.log('✅ API docs successful:', docsResponse.data.success);

    // Test auth registration
    console.log('\n3️⃣ Testing user registration...');
    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, {
      name: 'API Test User 2',
      email: 'apitest2@test.com',
      password: 'Test123',
      phone: '1234567890',
      role: 'member',
    });
    console.log('✅ Registration successful:', registerResponse.data.success);

    // Test auth login
    console.log('\n4️⃣ Testing user login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'apitest2@test.com',
      password: 'Test123',
    });
    console.log('✅ Login successful:', loginResponse.data.success);
    console.log('🔑 Token received:', !!loginResponse.data.data?.token);

    console.log('\n🎉 All API tests passed! The backend is working correctly.');
    console.log('📱 The client should now be able to connect successfully.');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }
  }
}

testApiConnection();
