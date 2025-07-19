#!/usr/bin/env node

const axios = require('axios');

const testUrls = [
  'http://localhost:3000/health',
  'http://localhost:3000/api/docs',
  'http://localhost:3000/api/auth/login',
];

async function testConnection() {
  console.log('🔍 Testing API connectivity...\n');

  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await axios.get(url, {
        timeout: 5000,
      });

      console.log(`✅ Status: ${response.status} - ${response.statusText}`);

      if (response.data) {
        console.log(
          `📄 Response: ${JSON.stringify(response.data).substring(0, 100)}...`
        );
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('---');
  }

  console.log('\n🎯 Recommendations:');
  console.log('1. Make sure the backend server is running');
  console.log('2. Check if the server is on the correct IP/port');
  console.log('3. Verify firewall settings');
  console.log('4. Ensure both devices are on the same network');
}

testConnection().catch(console.error);
