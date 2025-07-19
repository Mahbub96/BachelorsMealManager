#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate secure JWT secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

// Read the current .env file
const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace the JWT secrets
envContent = envContent.replace(
  /JWT_SECRET=your-super-secret-jwt-key-change-this-in-production/g,
  `JWT_SECRET=${jwtSecret}`
);

envContent = envContent.replace(
  /JWT_REFRESH_SECRET=your-refresh-secret-key/g,
  `JWT_REFRESH_SECRET=${jwtRefreshSecret}`
);

// Write the updated .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ Environment variables updated with secure JWT secrets');
console.log('✅ JWT_SECRET and JWT_REFRESH_SECRET have been generated');
