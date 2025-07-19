#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Bachelor Mess Client - Debug Information\n");

// Check package.json
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  console.log("📦 Package.json Info:");
  console.log(`   Name: ${packageJson.name}`);
  console.log(`   Version: ${packageJson.version}`);
  console.log(`   Main: ${packageJson.main}`);
  console.log(`   React: ${packageJson.dependencies.react}`);
  console.log(`   React Native: ${packageJson.dependencies["react-native"]}`);
  console.log(`   Expo: ${packageJson.dependencies.expo}\n`);
} catch (error) {
  console.log("❌ Error reading package.json:", error.message);
}

// Check key files
const keyFiles = [
  "app/_layout.tsx",
  "app/(tabs)/_layout.tsx",
  "app/(tabs)/index.tsx",
  "context/AuthContext.tsx",
  "app/HomePage.tsx",
];

console.log("📁 Key Files Status:");
keyFiles.forEach((file) => {
  try {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`   ✅ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`   ❌ ${file} (missing)`);
    }
  } catch (error) {
    console.log(`   ❌ ${file} (error: ${error.message})`);
  }
});

console.log("\n🚀 Common Issues & Solutions:");
console.log(
  "   1. React version mismatch: npm install react@19.0.0 react-native@0.79.4"
);
console.log("   2. Clear cache: npx expo start --clear");
console.log("   3. Reset node_modules: rm -rf node_modules && npm install");
console.log(
  "   4. Check imports: Ensure all imports are correct and files exist"
);
console.log(
  "   5. AuthContext: Make sure context is properly wrapped in _layout.tsx"
);

console.log("\n✨ App should now be running without errors!");
