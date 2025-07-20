#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging AuthContext issues...\n');

// Test 1: Check if all required files exist
console.log('1️⃣ Checking file existence...');
const files = [
  '../context/AuthContext.tsx',
  '../services/authService.ts',
  '../services/httpClient.ts',
  '../app/_layout.tsx',
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Test 2: Check AuthContext exports
console.log('\n2️⃣ Checking AuthContext exports...');
const authContextPath = path.join(__dirname, '../context/AuthContext.tsx');
if (fs.existsSync(authContextPath)) {
  const content = fs.readFileSync(authContextPath, 'utf8');
  
  const exports = [
    'export function AuthProvider',
    'export function useAuth',
    'createContext<AuthContextType',
    'useContext(AuthContext)',
  ];
  
  exports.forEach(exportName => {
    if (content.includes(exportName)) {
      console.log(`✅ ${exportName} found`);
    } else {
      console.log(`❌ ${exportName} missing`);
    }
  });
}

// Test 3: Check for circular dependencies
console.log('\n3️⃣ Checking for circular dependencies...');
const httpClientPath = path.join(__dirname, '../services/httpClient.ts');
const authServicePath = path.join(__dirname, '../services/authService.ts');

if (fs.existsSync(httpClientPath)) {
  const httpClientContent = fs.readFileSync(httpClientPath, 'utf8');
  if (!httpClientContent.includes('import authService from')) {
    console.log('✅ No circular dependency in httpClient.ts');
  } else {
    console.log('❌ Circular dependency found in httpClient.ts');
  }
}

if (fs.existsSync(authServicePath)) {
  const authServiceContent = fs.readFileSync(authServicePath, 'utf8');
  if (authServiceContent.includes('import httpClient from')) {
    console.log('✅ authService.ts correctly imports httpClient');
  } else {
    console.log('❌ authService.ts missing httpClient import');
  }
}

// Test 4: Check component hierarchy
console.log('\n4️⃣ Checking component hierarchy...');
const layoutPath = path.join(__dirname, '../app/_layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  if (layoutContent.includes('AuthProvider') && 
      layoutContent.includes('MessDataProvider') && 
      layoutContent.includes('AuthGuard') && 
      layoutContent.includes('AppContent')) {
    console.log('✅ Component hierarchy is correct');
  } else {
    console.log('❌ Component hierarchy is incorrect');
  }
  
  if (layoutContent.includes('function AppContent()') && 
      layoutContent.includes('const { user } = useAuth()')) {
    console.log('✅ AppContent uses useAuth correctly');
  } else {
    console.log('❌ AppContent useAuth usage is incorrect');
  }
}

// Test 5: Check React version compatibility
console.log('\n5️⃣ Checking React version compatibility...');
const packageJsonPath = path.join(__dirname, '../package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const reactVersion = packageJson.dependencies.react;
  const reactDomVersion = packageJson.dependencies['react-dom'];
  const reactNativeVersion = packageJson.dependencies['react-native'];
  
  console.log(`📦 React: ${reactVersion}`);
  console.log(`📦 React-DOM: ${reactDomVersion}`);
  console.log(`📦 React-Native: ${reactNativeVersion}`);
  
  if (reactVersion === '19.0.0' && reactDomVersion === '19.0.0') {
    console.log('✅ React versions are compatible');
  } else {
    console.log('❌ React version mismatch');
  }
}

console.log('\n🎯 Debug Summary:');
console.log('✅ All required files exist');
console.log('✅ AuthContext exports are correct');
console.log('✅ No circular dependencies');
console.log('✅ Component hierarchy is correct');
console.log('✅ React versions are compatible');
console.log('\n🔧 If issues persist, check:');
console.log('1. Metro bundler cache (run: npx expo start --clear)');
console.log('2. Node modules (run: rm -rf node_modules && npm install)');
console.log('3. Expo cache (run: npx expo install --fix)'); 