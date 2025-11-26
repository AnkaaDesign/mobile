#!/usr/bin/env node

/**
 * Diagnostic Tool - Check Auth Token and API Access
 * Run this to see what's really happening with your authentication
 */

const axios = require('axios');

const API_URL = 'http://192.168.0.13:3030';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testEndpoint(name, url, token = null) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${API_URL}${url}`, {
      headers,
      validateStatus: () => true // Don't throw on any status
    });

    log(`  ✓ ${name}`, 'green');
    log(`    Status: ${response.status}`, 'yellow');
    log(`    Message: ${response.data?.message || 'No message'}`, 'yellow');

    return {
      success: response.status < 400,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    log(`  ✗ ${name}`, 'red');
    log(`    Error: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message,
    };
  }
}

async function diagnose() {
  logSection('🔍 API Diagnostics - Backup "404" Investigation');

  // Step 1: Test API connectivity
  logSection('Step 1: Testing API Connectivity');
  await testEndpoint('Backend Health Check', '/health');
  await testEndpoint('Server Status', '/server/status');

  // Step 2: Test backup endpoint WITHOUT auth
  logSection('Step 2: Testing /backups WITHOUT Authentication');
  const backupsNoAuth = await testEndpoint('Backups Endpoint (No Auth)', '/backups');

  if (backupsNoAuth.status === 401) {
    log('\n  ℹ️  Expected result: 401 Unauthorized', 'cyan');
    log('  This confirms the endpoint EXISTS but requires authentication', 'cyan');
  } else if (backupsNoAuth.status === 404) {
    log('\n  ⚠️  Unexpected: 404 Not Found', 'yellow');
    log('  The endpoint might not exist or route is wrong', 'yellow');
  }

  // Step 3: Try to get token from AsyncStorage (if available)
  logSection('Step 3: Checking for Stored Auth Token');
  log('  To test with your actual token:', 'yellow');
  log('  1. Open your mobile app', 'yellow');
  log('  2. Open React Dev Tools or Expo Dev Menu', 'yellow');
  log('  3. Run: await AsyncStorage.getItem("authToken")', 'yellow');
  log('  4. Copy the token value', 'yellow');
  log('  5. Run this script again with: node diagnose-auth.js YOUR_TOKEN', 'yellow');

  const token = process.argv[2];
  if (token) {
    logSection('Step 4: Testing WITH Your Auth Token');
    log(`  Using token: ${token.substring(0, 20)}...`, 'cyan');

    const backupsWithAuth = await testEndpoint('Backups Endpoint (With Auth)', '/backups', token);

    if (backupsWithAuth.success) {
      log('\n  ✅ SUCCESS! Token is valid and you have access!', 'green');
      log(`  Found ${backupsWithAuth.data?.data?.length || 0} backups`, 'green');
    } else if (backupsWithAuth.status === 401) {
      log('\n  ❌ Token is INVALID or EXPIRED', 'red');
      log('  Solution: Logout and login again in the mobile app', 'yellow');
    } else if (backupsWithAuth.status === 403) {
      log('\n  ❌ Token is valid but you lack ADMIN privileges', 'red');
      log('  Solution: Login with an account that has ADMIN role', 'yellow');
    } else if (backupsWithAuth.status === 404) {
      log('\n  ⚠️  Getting 404 even with token - this is strange!', 'yellow');
      log('  The route might be configured differently', 'yellow');
    }
  }

  // Step 4: Test other server endpoints
  logSection('Step 5: Testing Other Server Endpoints');
  await testEndpoint('System Services', '/server/services');
  await testEndpoint('System Users', '/server/users');
  await testEndpoint('System Metrics', '/server/metrics');

  // Summary
  logSection('📊 Diagnosis Summary');

  if (backupsNoAuth.status === 401) {
    log('✓ Backend is running correctly', 'green');
    log('✓ /backups endpoint exists', 'green');
    log('✓ Authentication is required (expected)', 'green');
    log('', 'reset');
    log('The "404" you\'re seeing is likely:', 'yellow');
    log('  1. An authentication error (401) being displayed as "404"', 'yellow');
    log('  2. Expired or invalid token', 'yellow');
    log('  3. User lacks ADMIN privileges', 'yellow');
    log('', 'reset');
    log('Solutions:', 'cyan');
    log('  1. Logout and login again in mobile app', 'cyan');
    log('  2. Ensure you login with an ADMIN account', 'cyan');
    log('  3. Clear mobile app cache completely', 'cyan');
    log('  4. Check AsyncStorage has valid token', 'cyan');
  } else if (backupsNoAuth.status === 404) {
    log('⚠️  The /backups endpoint returned 404', 'red');
    log('This means either:', 'red');
    log('  1. Backend server is not running', 'red');
    log('  2. Route is not registered', 'red');
    log('  3. Wrong base URL configuration', 'red');
  }

  console.log('\n');
}

// Run diagnostics
diagnose().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
