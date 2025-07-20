#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

console.log('🔍 Testing config environment variables...\n');

// Test environment variables
const envVars = {
  'EXPO_PUBLIC_API_URL': process.env.EXPO_PUBLIC_API_URL,
  'EXPO_PUBLIC_API_TIMEOUT': process.env.EXPO_PUBLIC_API_TIMEOUT,
  'EXPO_PUBLIC_API_MAX_RETRIES': process.env.EXPO_PUBLIC_API_MAX_RETRIES,
  'NODE_ENV': process.env.NODE_ENV,
};

console.log('📋 Environment variables:');
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}=${value}`);
  } else {
    console.log(`❌ ${key} not set`);
  }
});

// Test config logic
console.log('\n🔧 Testing config logic...');

const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  console.log('🔧 EXPO_PUBLIC_API_URL from process.env:', envUrl);
  
  if (envUrl) {
    console.log('✅ Using environment API URL:', envUrl);
    return envUrl;
  }
  
  console.log('❌ Environment variable not found, using fallback');
  return 'http://192.168.0.130:3000/api';
};

const apiUrl = getApiUrl();
console.log('🎯 Final API URL:', apiUrl);

console.log('\n📱 The app should use this URL for API calls!'); 