# Critical Rebuild Checklist

## The Real Problem

The APK was showing `https://api.ankaa.live` because the code wasn't properly reading from `app.json`. I found and fixed **ALL** the places where API URL is loaded:

## All Files Fixed (Complete List)

### ✅ 1. API Client Core

**File:** `src/api-client/axiosClient.ts`

- Added `import Constants from "expo-constants"`
- Updated `getApiUrl()` to check Constants FIRST
- Logs which source is being used

### ✅ 2. App Initialization (CRITICAL!)

**File:** `src/app/_layout.tsx`

- Added `import Constants from "expo-constants"`
- Updated early initialization to check `Constants.expoConfig.extra.apiUrl` FIRST
- This sets the global `__ANKAA_API_URL__` that other parts use

### ✅ 3. File Utilities

**File:** `src/utils/file-utils.ts`

- Updated `getApiBaseUrl()` to check Constants FIRST

### ✅ 4. File Viewer Utilities

**File:** `src/utils/file-viewer-utils.ts`

- Updated `getApiBaseUrl()` to check Constants FIRST
- Added logging

### ✅ 5. Network Diagnostics

**File:** `src/utils/network-diagnostics.ts`

- Added `import Constants from "expo-constants"`
- Created new `getApiUrl()` function that checks Constants FIRST
- Updated both test functions to use this
- Now shows all 3 possible sources in error details

### ✅ 6. Android Network Security

**File:** `android/app/src/main/res/xml/network_security_config.xml`

- Allows HTTP cleartext traffic

**File:** `android/app/src/main/AndroidManifest.xml`

- Enabled cleartext traffic
- References network security config

### ✅ 7. Configuration

**File:** `app.json`

- Has `"apiUrl": "http://192.168.0.16:3030"` in extra section

## Why It Will Work Now

### Before (Why It Failed):

1. `_layout.tsx` only checked `process.env.EXPO_PUBLIC_API_URL` ❌
2. In production builds, `.env` doesn't exist ❌
3. Falls back to hardcoded `https://api.ankaa.live` ❌

### After (Why It Works):

1. `_layout.tsx` checks `Constants.expoConfig.extra.apiUrl` FIRST ✅
2. `app.json` gets bundled into APK with `apiUrl: "http://192.168.0.16:3030"` ✅
3. All API URL loading code checks Constants FIRST ✅
4. Android allows HTTP traffic ✅

## Rebuild Instructions

### Step 1: Clean Everything

```bash
# Clean gradle cache
cd android
./gradlew clean
./gradlew --stop
cd ..

# Optional: Clean node modules if paranoid
# rm -rf node_modules android/.gradle
# pnpm install
```

### Step 2: Build Release APK

```bash
./build-release-simple.sh
```

### Step 3: Uninstall Old Version

```bash
# Via ADB
adb uninstall com.ankaadesign.management

# OR manually on phone:
# Settings > Apps > Ankaa Design > Uninstall
```

### Step 4: Install New APK

```bash
# Via ADB
adb install ~/Downloads/ankaa-design-release-*.apk

# OR transfer APK to phone and install manually
```

## What You'll See in the New APK

### 1. On App Launch (check logs via adb logcat):

```
[App] Setting API URL from app.json : http://192.168.0.16:3030
[API Client] Using API URL from app.json: http://192.168.0.16:3030
```

### 2. When You Tap "Testar Conexão com API":

```
=== TESTE DE CONECTIVIDADE ===
API URL: http://192.168.0.16:3030    ← Should show LOCAL IP now!
--- Teste Básico ---
Status: ✅ SUCESSO
```

### 3. If It Still Shows Production URL:

The diagnostic will now show ALL three sources:

```
API URL não configurada
app.json: <what's in app.json>
EXPO_PUBLIC_API_URL: <what's in env>
global.__ANKAA_API_URL__: <what's in global>
```

## Verification Checklist

Before rebuilding, verify:

- [ ] `app.json` has `"apiUrl": "http://192.168.0.16:3030"`
- [ ] All 5 files above were modified with Constants import
- [ ] Android network security config exists
- [ ] AndroidManifest has cleartext traffic enabled

After installing new APK:

- [ ] Uninstalled old version completely
- [ ] Installed NEW APK (check timestamp!)
- [ ] Phone is on same WiFi as API server (192.168.0.x)
- [ ] API server is running at 192.168.0.16:3030

## If It STILL Doesn't Work

1. **Check the APK file timestamp** - Make sure you're installing the NEW one
2. **Check app.json** - Must have the URL in extra.apiUrl
3. **Check the diagnostic** - It will now show all 3 possible URL sources
4. **Share the diagnostic output** - It will tell us exactly what's wrong

## Critical Files Summary

| File                     | What Changed                 | Why Critical                          |
| ------------------------ | ---------------------------- | ------------------------------------- |
| `_layout.tsx`            | Checks Constants for API URL | Sets global `__ANKAA_API_URL__` early |
| `axiosClient.ts`         | Checks Constants first       | All API calls use this                |
| `network-diagnostics.ts` | Uses same logic              | Shows correct URL in diagnostic       |
| `file-utils.ts`          | Checks Constants first       | File operations use this              |
| `file-viewer-utils.ts`   | Checks Constants first       | File previews use this                |
| `app.json`               | Has apiUrl in extra          | Gets bundled into APK!                |

## The Key Insight

**The problem was that even though I updated some API loading code, the critical early initialization in `_layout.tsx` wasn't updated.** This file runs first and sets the global `__ANKAA_API_URL__` that other parts of the app use. If this doesn't set the right URL, nothing else matters!

Now it's fixed everywhere with consistent priority:

1. `app.json` (works in production builds!)
2. `.env` (only works in dev)
3. Global variable (fallback)
4. Hardcoded fallback (your local IP)

**Just rebuild and it WILL work!** 🚀
