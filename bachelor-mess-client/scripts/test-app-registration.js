#!/usr/bin/env node

const axios = require('axios');

// Test registration exactly like our app does
async function testAppRegistration() {
  console.log('🧪 Testing registration exactly like our app...\n');

  const testUser = {
    name: 'Test User App Style',
    email: `testuser${Date.now()}@example.com`,
    password: 'Password123',
    phone: '1234567890',
    role: 'admin'  // Our app sends this
  };

  try {
    console.log('📝 Registration data:', testUser);
    console.log('📝 Registration URL: https://mess.mahbub.dev/api/auth/register');
    
    const response = await axios.post(
      'https://mess.mahbub.dev/api/auth/register',
      testUser,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
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

testAppRegistration().catch(console.error); 