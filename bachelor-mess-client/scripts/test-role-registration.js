#!/usr/bin/env node

const axios = require('axios');

// Test registration with role field (like our app does)
async function testRoleRegistration() {
  console.log('🧪 Testing user registration with role field...\n');

  const testUser = {
    name: 'Test User with Role',
    email: `testuser${Date.now()}@example.com`,
    password: 'Password123',
    phone: '1234567890',
    role: 'admin'  // This is what our app sends
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
      role: loginResponse.data.data?.user?.role,
      token: loginResponse.data.data?.token ? 'Present' : 'Missing'
    });

  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data || error.message);
    console.log('❌ Error status:', error.response?.status);
    console.log('❌ Error details:', error.response?.data);
  }
}

testRoleRegistration().catch(console.error); 