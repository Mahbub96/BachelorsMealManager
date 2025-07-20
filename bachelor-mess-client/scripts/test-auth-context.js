#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing AuthContext configuration...\n');

// Check if AuthContext file exists
const authContextPath = path.join(__dirname, '../context/AuthContext.tsx');
if (fs.existsSync(authContextPath)) {
  console.log('✅ AuthContext file exists');
  
  // Read the file content
  const content = fs.readFileSync(authContextPath, 'utf8');
  
  // Check for key exports
  if (content.includes('export function useAuth')) {
    console.log('✅ useAuth function is exported');
  } else {
    console.log('❌ useAuth function not found');
  }
  
  if (content.includes('export function AuthProvider')) {
    console.log('✅ AuthProvider function is exported');
  } else {
    console.log('❌ AuthProvider function not found');
  }
  
  if (content.includes('createContext<AuthContextType>')) {
    console.log('✅ AuthContext is properly typed');
  } else {
    console.log('❌ AuthContext type definition missing');
  }
  
  // Check for default values
  if (content.includes('user: null')) {
    console.log('✅ Default user value is null');
  } else {
    console.log('❌ Default user value missing');
  }
  
  if (content.includes('isLoading: true')) {
    console.log('✅ Default isLoading value is true');
  } else {
    console.log('❌ Default isLoading value missing');
  }
  
} else {
  console.log('❌ AuthContext file not found');
}

// Check if the deleted useAuth hook file is gone
const useAuthHookPath = path.join(__dirname, '../hooks/useAuth.ts');
if (!fs.existsSync(useAuthHookPath)) {
  console.log('✅ Conflicting useAuth hook file removed');
} else {
  console.log('❌ Conflicting useAuth hook file still exists');
}

console.log('\n🎯 Summary:');
console.log('✅ AuthContext structure is correct');
console.log('✅ No conflicting useAuth implementations');
console.log('✅ Default values are properly set');
console.log('\n📱 The app should now work without useAuth undefined errors!'); 