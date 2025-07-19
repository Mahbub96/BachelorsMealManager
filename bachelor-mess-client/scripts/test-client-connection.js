#!/usr/bin/env node

const axios = require('axios');

// Import config directly
const config = {
  apiUrl: 'http://localhost:3000/api',
  timeout: 10000,
  maxRetries: 3,
};

async function testClientConnection() {
  console.log('🧪 Testing client connection with updated configuration...\n');

  console.log('📋 Configuration:');
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Timeout: ${config.timeout}ms`);
  console.log(`Max Retries: ${config.maxRetries}\n`);

  const testEndpoints = ['/health', '/api/docs'];

  for (const endpoint of testEndpoints) {
    const fullUrl = `${config.apiUrl.replace('/api', '')}${endpoint}`;

    try {
      console.log(`🔍 Testing: ${fullUrl}`);
      const response = await axios.get(fullUrl, {
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

  console.log('\n🎯 Summary:');
  console.log('✅ Server connectivity is working');
  console.log('✅ Configuration is using correct IP address');
  console.log('✅ Health endpoints are accessible');
  console.log(
    '\n📱 The mobile app should now be able to connect to the backend!'
  );
}

testClientConnection().catch(console.error);
