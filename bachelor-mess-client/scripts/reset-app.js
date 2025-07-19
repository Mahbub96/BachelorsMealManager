#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting app reset...');

try {
  // Clear React Native cache
  console.log('📱 Clearing React Native cache...');
  execSync('npx expo start --clear', { stdio: 'inherit' });

  // Clear node_modules cache
  console.log('📦 Clearing node_modules cache...');
  execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });

  // Clear Expo cache
  console.log('📱 Clearing Expo cache...');
  execSync('rm -rf .expo', { stdio: 'inherit' });
  execSync('rm -rf .expo-shared', { stdio: 'inherit' });

  // Clear Metro cache
  console.log('🚇 Clearing Metro cache...');
  execSync('npx react-native start --reset-cache', { stdio: 'inherit' });

  console.log('✅ App reset completed!');
  console.log('🔄 Restarting development server...');

  // Restart the development server
  execSync('npm start', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Reset failed:', error.message);
  process.exit(1);
}
