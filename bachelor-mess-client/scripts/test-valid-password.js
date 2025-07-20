#!/usr/bin/env node

const axios = require('axios');

// Test registration with a valid password that meets server requirements
async function testValidPassword() {
  console.log('🧪 Testing with valid password...\n');

  const testUser = {
    name: "Mahbub Alam",
    email: "mahbub@mess.com",
    phone: "01784310996",
    password: "Password123", // Meets requirements: uppercase, lowercase, number
    role: "admin"
  };

  try {
    console.log('📝 Registration data:', JSON.stringify(testUser, null, 2));
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
    console.log('❌ Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('❌ Error:', error.message);
  }
}

testValidPassword().catch(console.error); 