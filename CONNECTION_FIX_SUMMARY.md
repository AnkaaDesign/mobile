# Connection Error Fix - Summary

## Problem Identified
The "Erro de conexão" was caused by **Android blocking HTTP (cleartext) traffic**. Starting from Android 9 (API level 28), cleartext traffic is disabled by default for security reasons. Your API is working correctly, but Android was silently blocking all HTTP connections.

## Root Cause Analysis
1. ✅ API is running and accessible at `192.168.0.13:3030`
2. ✅ CORS is configured correctly
3. ✅ `.env` has correct `EXPO_PUBLIC_API_URL="http://192.168.0.13:3030"`
4. ❌ **Android was blocking HTTP traffic** (this was the issue)

## Changes Made

### 1. Android Network Security Configuration
**File Created:** `android/app/src/main/res/xml/network_security_config.xml`
- Allows HTTP (cleartext) traffic for development/testing
- Can be restricted to specific domains for production

**File Modified:** `android/app/src/main/AndroidManifest.xml`
- Added `android:usesCleartextTraffic="true"`
- Added `android:networkSecurityConfig="@xml/network_security_config"`

### 2. Enhanced Error Logging
**File Modified:** `src/contexts/auth-context.tsx`
- Added detailed console logging for debugging
- Added Alert dialog showing complete error details including:
  - Error message
  - HTTP status code
  - Error type
  - Network error detection
  - Timeout detection
  - Current API URL
  - Full error object

### 3. Network Diagnostics Tool
**File Created:** `src/utils/network-diagnostics.ts`
- Test basic API connectivity
- Test authentication endpoint
- Run full diagnostic suite
- Copy results to clipboard

**File Modified:** `src/app/(autenticacao)/entrar.tsx`
- Added "Testar Conexão com API" button to login screen
- Provides detailed network diagnostics

### 4. API URL Configuration
**File Modified:** `app.json`
- Added `apiUrl` to `extra` section
- Ensures API URL is baked into the APK build

### 5. API CORS Update (Preventive)
**File Modified:** `../api/.env`
- Added mobile origin to CORS_ORIGINS
- Note: Mobile apps typically don't send Origin header, but this ensures compatibility

## How to Rebuild and Test

### Option 1: Using Your Build Script (Recommended)
```bash
./build-release-simple.sh
```

This will:
- Clean previous builds
- Build a fresh release APK with all fixes
- Copy APK to `~/Downloads/ankaa-design-release-[timestamp].apk`

### Option 2: Manual Build
```bash
cd android
./gradlew clean
./gradlew assembleRelease
# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### Option 3: Expo Build
```bash
npx expo run:android --variant release
```

## Testing the New APK

1. **Uninstall the old APK** from your phone
   ```bash
   adb uninstall com.ankaadesign.management
   ```

2. **Install the new APK**
   ```bash
   adb install ~/Downloads/ankaa-design-release-[timestamp].apk
   # Or transfer to phone and install manually
   ```

3. **Make sure your phone is on the same WiFi network** (192.168.0.x)

4. **Launch the app**

5. **Before trying to login, tap "Testar Conexão com API"** button
   - This will show you a detailed diagnostic report
   - If tests pass, login should work
   - If tests fail, the report will tell you why

6. **Try to login**
   - If it still fails, you'll see a detailed error alert
   - Share the error details for further debugging

## Debugging with the New Tools

### Connection Test Button
The login screen now has a "Testar Conexão com API" button that will:
1. Test basic connectivity to the API
2. Test the authentication endpoint specifically
3. Show response times and HTTP status codes
4. Identify common issues (timeout, network error, cleartext blocking)
5. Provide actionable suggestions

### Enhanced Error Alerts
When login fails, you'll now see:
- Detailed error message
- HTTP status code
- Error type
- Whether it's a network error
- Whether it's a timeout
- Current API URL being used
- Full error object (first 200 chars)

## Expected Results

After rebuilding with these fixes:

✅ **Connection Test should show:**
```
=== TESTE DE CONECTIVIDADE ===
API URL: http://192.168.0.13:3030

--- Teste Básico ---
Status: ✅ SUCESSO
Mensagem: Conexão bem-sucedida!
Tempo: 50ms
HTTP Status: 200

--- Teste de Login ---
Status: ✅ SUCESSO
Mensagem: Endpoint de login acessível!
Tempo: 120ms
HTTP Status: 400

=== DIAGNÓSTICO ===
✅ Conexão OK - API está acessível!
```

Note: HTTP 400 on login test is expected (we send test data). What matters is that the endpoint is reachable.

## If Connection Still Fails

If the connection test still fails after rebuilding:

1. **Check the diagnostic report** - it will tell you the specific issue
2. **Verify API is running:**
   ```bash
   curl http://192.168.0.13:3030/
   ```
3. **Verify phone and API are on same network:**
   - Check phone WiFi settings
   - Check API server IP hasn't changed
4. **Check firewall:** Make sure no firewall is blocking port 3030
5. **Try from another device** on the same network to isolate the issue

## For Production

When deploying to production:

1. **Set up HTTPS** for your API (required)
2. **Update network_security_config.xml** to restrict cleartext to specific domains only
3. **Remove `android:usesCleartextTraffic="true"`** from AndroidManifest
4. **Update `.env` and `app.json`** with production HTTPS URL
5. **Remove or disable the diagnostic button** from login screen

## Files Changed

### Mobile App
- ✅ `android/app/src/main/res/xml/network_security_config.xml` (created)
- ✅ `android/app/src/main/AndroidManifest.xml` (modified)
- ✅ `src/contexts/auth-context.tsx` (modified)
- ✅ `src/utils/network-diagnostics.ts` (created)
- ✅ `src/app/(autenticacao)/entrar.tsx` (modified)
- ✅ `app.json` (modified)

### API
- ✅ `../api/.env` (modified - added mobile origin to CORS)

## Console Logs to Watch

When you try to login, watch the console for:
```
[AUTH] Starting login attempt...
[AUTH] Contact: your@email.com
[AUTH] API URL: http://192.168.0.13:3030
[Network Diagnostics] Testing connection to: http://192.168.0.13:3030
```

These logs will help identify where the connection is failing.

## Next Steps

1. ✅ Rebuild the APK using `./build-release-simple.sh`
2. ✅ Uninstall old APK from phone
3. ✅ Install new APK
4. ✅ Tap "Testar Conexão com API" button first
5. ✅ Check the diagnostic results
6. ✅ Try to login
7. ✅ If it fails, share the error details from the alert

The enhanced logging and diagnostics will give us much more information to work with if there are any remaining issues.
