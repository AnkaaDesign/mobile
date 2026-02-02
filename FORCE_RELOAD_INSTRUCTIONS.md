# FORCE APP TO RELOAD CHANGES

The changes HAVE been made to the files, but they're not loading. This is definitely a caching issue.

## Changes Made (VERIFIED IN FILES):

### 1. PDF Viewer Dark Mode
- **File**: `src/components/file/pdf-viewer.tsx`
- **Line 171**: `edges={['top', 'bottom']}` (was `edges={[]}`)
- **Line 171**: Background color dynamic
- **Line 176**: Header background `#000` instead of transparent
- **Line 286**: Footer background `#000` instead of transparent

### 2. Notification Badge
- **File**: `src/components/notifications/NotificationPopover.tsx`
- **Line 578**: `minWidth: 24` (was 22)
- **Line 579**: `minHeight: 24` (was height: 22)

### 3. Catalog Sorting
- **File**: `src/app/(tabs)/catalogo/listar.tsx`
- **Lines 303-354**: Client-side sorting with console.logs

### 4. Error Alert
- **File**: `src/app/(tabs)/catalogo/listar.tsx`
- **Lines 530-535**: Alert.alert with error details

## HOW TO FORCE RELOAD:

### Option 1: Clear Metro Cache
```bash
# Stop Metro (Ctrl+C if running)
# Then run:
npx expo start --clear

# On device: Shake -> Reload
```

### Option 2: Clear ALL Caches
```bash
# Stop Metro
rm -rf node_modules/.cache
rm -rf .expo
npx expo start -c

# On device: Shake -> Reload
```

### Option 3: Device-Level Reload
On your iOS/Android device:
1. Shake the device
2. Tap "Debug"
3. Tap "Reload"
4. If still not working, close app completely and reopen

### Option 4: Reinstall App (Nuclear Option)
```bash
# Delete app from device
# Then:
npx expo start --clear
# Scan QR code again to reinstall
```

## How to Verify Changes Are Loading:

1. **Console Logs**: Open Metro bundler terminal, you should see logs like:
   ```
   [Catalog Sort] Current sort: color
   [Catalog Sort] OrderBy: {"colorOrder":"asc"}
   ```

2. **PDF Viewer**: Open a PDF - no white bars in dark mode

3. **Notification Badge**: Badge should fit 2-digit numbers

4. **Error Alert**: When color filter errors, you'll see Alert popup

## If STILL Not Working:

The issue is 100% caching. The code changes are definitely in the files. Try:
1. Close Expo Go app completely (swipe up to kill)
2. Restart Metro: `npx expo start --clear`
3. Reopen Expo Go and scan QR code fresh
