#!/usr/bin/env node

/**
 * Clear Authentication Storage Utility
 *
 * This script helps clear corrupted authentication state from AsyncStorage.
 * Run this script and then restart your app to reset authentication.
 *
 * Usage:
 *   node clear-auth-storage.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║    Clear Authentication Storage Utility                  ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('This utility will help you clear corrupted authentication data.');
console.log('\nTo clear the authentication state, follow these steps:\n');

console.log('METHOD 1 - Using Expo DevTools (Recommended):');
console.log('1. While your app is running in development mode');
console.log('2. Press "j" to open the debugger');
console.log('3. In the browser console, paste this code:\n');
console.log('   (async () => {');
console.log('     const AsyncStorage = require("@react-native-async-storage/async-storage").default;');
console.log('     await AsyncStorage.removeItem("@ankaa_token");');
console.log('     await AsyncStorage.removeItem("ankaa_token");');
console.log('     await AsyncStorage.removeItem("cached_user_data");');
console.log('     await AsyncStorage.removeItem("react-query-cache");');
console.log('     console.log("✅ Authentication storage cleared!");');
console.log('   })();');
console.log('\n4. Reload your app (press "r" in the terminal)\n');

console.log('METHOD 2 - Using Expo Go App:');
console.log('1. Shake your device to open the developer menu');
console.log('2. Tap "Settings"');
console.log('3. Tap "Clear AsyncStorage"');
console.log('4. Reload your app\n');

console.log('METHOD 3 - Complete App Reset:');
console.log('1. Stop your development server');
console.log('2. Run: npx expo start --clear');
console.log('3. This will clear all caches and storage\n');

console.log('After clearing storage, you should be able to login again.\n');

rl.question('Press Enter to close this utility...', () => {
  rl.close();
});
