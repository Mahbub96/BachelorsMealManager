#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the current .env file
const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Update CORS_ORIGIN to include the network IP and React Native
const newCorsOrigin =
  'http://localhost:3000,http://localhost:3001,http://192.168.0.130:3000,http://192.168.0.130:3001,http://localhost:8081,exp://192.168.0.130:8081';

// Replace the CORS_ORIGIN line
envContent = envContent.replace(
  /CORS_ORIGIN=.*/g,
  `CORS_ORIGIN=${newCorsOrigin}`
);

// Write the updated .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ CORS configuration updated to allow React Native connections');
console.log(
  '✅ Added network IP and Expo development server to allowed origins'
);
