#!/usr/bin/env node

// Test registration using React Native's fetch approach
async function testReactNativeFetch() {
  console.log('🧪 Testing with React Native fetch approach...\n');

  const testUser = {
    name: 'Test User React Native',
    email: `testuser${Date.now()}@example.com`,
    password: 'Password123',
    phone: '1234567890',
    role: 'admin'
  };

  const baseURL = 'https://mess.mahbub.dev';
  const endpoint = '/api/auth/register';
  const url = `${baseURL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    console.log('📝 Registration data:', JSON.stringify(testUser, null, 2));
    console.log('📝 Full URL:', url);
    console.log('📝 Headers:', JSON.stringify(headers, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testUser)
    });

    console.log('📄 Response status:', response.status);
    console.log('📄 Response statusText:', response.statusText);
    console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Registration successful!');
    console.log('📄 Response:', data);
    
  } catch (error) {
    console.log('❌ Registration failed:');
    console.log('❌ Error:', error.message);
  }
}

testReactNativeFetch().catch(console.error); 