#!/usr/bin/env node

const axios = require('axios');

// Test registration with all required fields
async function testRegistration() {
  console.log('🧪 Testing user registration with phone field...\n');

  const testUser = {
    name: 'Test User Registration',
    email: `testuser${Date.now()}@example.com`,
    password: 'Password123',
    phone: '1234567890'
  };

  try {
    console.log('📝 Registration data:', testUser);
    
    const response = await axios.post(
      'https://mess.mahbub.dev/api/auth/register',
      testUser,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Registration successful!');
    console.log('📄 Response:', response.data);
    
    // Test login with the new user
    console.log('\n🔐 Testing login with new user...');
    
    const loginResponse = await axios.post(
      'https://mess.mahbub.dev/api/auth/login',
      {
        email: testUser.email,
        password: testUser.password
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Login successful!');
    console.log('📄 Login response:', {
      success: loginResponse.data.success,
      user: loginResponse.data.data?.user?.name,
      token: loginResponse.data.data?.token ? 'Present' : 'Missing'
    });

  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data || error.message);
  }
}

testRegistration().catch(console.error); 