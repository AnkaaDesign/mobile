# API URL Fix - Production Build with Dev API

## Problem

The diagnostic showed the APK was trying to connect to `https://api.ankaa.live` (production) instead of `http://192.168.10.161:3030` (your local dev API). This happened because:

1. Release builds set `__DEV__` to `false`
2. The `.env` file doesn't get bundled into the APK
3. The code was falling back to hardcoded production URLs

## Solution

I've updated the API URL configuration to use `app.json` which DOES get bundled into the APK. This allows you to build a production-quality APK that points to your local dev API.

## Changes Made

### 1. Updated API URL Priority in All Files

**Priority Order (from highest to lowest):**

1. `app.json` → `extra.apiUrl` ✅ **Gets bundled into APK!**
2. `.env` → `EXPO_PUBLIC_API_URL` (only works in dev mode)
3. Global variable `__ANKAA_API_URL__`
4. Fallback to `http://192.168.10.161:3030`

**Files Updated:**

- ✅ `src/api-client/axiosClient.ts` - Added Constants import and updated getApiUrl()
- ✅ `src/utils/file-viewer-utils.ts` - Updated getApiBaseUrl()
- ✅ `src/utils/file-utils.ts` - Updated getApiBaseUrl()

### 2. Confirmed app.json Configuration

```json
{
  "extra": {
    "apiUrl": "http://192.168.10.161:3030"
  }
}
```

## How to Rebuild

### Step 1: Clean Build

```bash
cd android
./gradlew clean
cd ..
```

### Step 2: Build APK

Use your build script:

```bash
./build-release-simple.sh
```

Or manually:

```bash
cd android
./gradlew assembleRelease
```

### Step 3: Install New APK

```bash
# Uninstall old version
adb uninstall com.ankaadesign.management

# Install new version
adb install ~/Downloads/ankaa-design-release-[timestamp].apk
# Or transfer to phone and install manually
```

## Testing

1. Launch the app
2. **Before logging in, tap "Testar Conexão com API"**
3. You should now see:
   ```
   API URL: http://192.168.10.161:3030
   Status: ✅ SUCESSO
   ```
4. Try to login - it should work!

## What You'll See in Logs

When the app starts, you'll see console logs showing which API URL is being used:

```
[API Client] Using API URL from app.json: http://192.168.10.161:3030
[File Viewer] Using API URL from app.json: http://192.168.10.161:3030
```

This confirms it's using the correct URL from app.json.

## Switching Between Environments

### For Local Dev Testing (current setup)

**app.json:**

```json
"apiUrl": "http://192.168.10.161:3030"
```

### For Production Release

**app.json:**

```json
"apiUrl": "https://api.ankaa.live"
```

Just change the URL in `app.json` and rebuild!

## Why This Works

1. ✅ `app.json` gets bundled into the APK during build
2. ✅ `expo-constants` can read `app.json` config at runtime
3. ✅ Works in both dev and production builds
4. ✅ No need for `.env` to be bundled
5. ✅ Easy to change - just edit one line in `app.json`

## Alternative: Multiple Build Variants

If you want to maintain both dev and prod APKs, you can:

1. Keep `app.json` with production URL
2. Use Expo's environment-specific configs
3. Or create separate build scripts that modify `app.json` before building

But for now, the simple approach of just editing `app.json` before building works perfectly!

## Troubleshooting

If the diagnostic still shows the wrong URL after rebuilding:

1. **Make sure you're testing the NEW APK:**
   - Check file timestamp in Downloads
   - Uninstall old version completely first

2. **Verify app.json has correct URL:**

   ```bash
   cat app.json | grep apiUrl
   ```

   Should show: `"apiUrl": "http://192.168.10.161:3030"`

3. **Check console logs when app starts:**
   Should see: `[API Client] Using API URL from app.json: http://192.168.10.161:3030`

4. **If building with EAS Build, use `eas.json` configuration instead**

## Summary

✅ All API URL loading code updated to prioritize `app.json`
✅ `app.json` configured with your dev API URL
✅ Android network security allows HTTP traffic
✅ Diagnostic tools in place
✅ Ready to rebuild and test!

**Just run `./build-release-simple.sh` and install the new APK!**
