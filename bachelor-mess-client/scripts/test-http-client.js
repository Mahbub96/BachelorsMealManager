#!/usr/bin/env node

const axios = require('axios');

// Test registration using our app's exact approach
async function testHttpClient() {
  console.log('🧪 Testing with our app\'s HTTP client approach...\n');

  const testUser = {
    name: 'Test User HTTP Client',
    email: `testuser${Date.now()}@example.com`,
    password: 'Password123',
    phone: '1234567890',
    role: 'admin'
  };

  const baseURL = 'https://mess.mahbub.dev';
  const endpoint = '/api/auth/register';
  const url = `${baseURL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    console.log('📝 Registration data:', JSON.stringify(testUser, null, 2));
    console.log('📝 Full URL:', url);
    console.log('📝 Headers:', JSON.stringify(defaultHeaders, null, 2));
    
    const response = await axios.post(
      url,
      testUser,
      {
        headers: defaultHeaders,
        timeout: 10000
      }
    );

    console.log('✅ Registration successful!');
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.log('❌ Registration failed:');
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Status Text:', error.response?.statusText);
    console.log('❌ Headers:', error.response?.headers);
    console.log('❌ Data:', error.response?.data);
    console.log('❌ Error:', error.message);
  }
}

testHttpClient().catch(console.error); 