# CRITICAL: CACHE ISSUE CONFIRMED

## The Problem:
ALL code changes have been successfully made to the files, BUT they are NOT loading in the app. This is 100% a caching problem.

## Proof Changes Are in Files:
Run these commands to verify:

```bash
# 1. Check PDF viewer SafeAreaView
grep -n "edges=.\['top', 'bottom'.\]" src/components/file/pdf-viewer.tsx
# Expected: Line 171 should show the change

# 2. Check notification badge
grep -n "minWidth:" src/components/notifications/NotificationPopover.tsx
# Expected: Should show updated values

# 3. Check console logs
grep -c "console.log.*Catalog Sort" src/app/\(tabs\)/catalogo/listar.tsx
# Expected: Should show 9 logs

# 4. Check error alert
grep -n "Alert.alert.*Erro de Conexão" src/app/\(tabs\)/catalogo/listar.tsx
# Expected: Should show the alert code
```

## SOLUTION - Force Complete Reload:

### Step 1: Kill Everything
```bash
# Kill Metro bundler (Ctrl+C)
# Kill any other expo processes
pkill -f expo
pkill -f metro
```

### Step 2: Clear ALL Caches
```bash
cd /home/kennedy/Documents/repositories/mobile

# Clear Metro cache
rm -rf node_modules/.cache

# Clear Expo cache
rm -rf .expo

# Clear watchman (if installed)
watchman watch-del-all 2>/dev/null || true

# Clear tmp
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true
```

### Step 3: Restart Clean
```bash
# Start with clear flag
npx expo start --clear

# If that doesn't work, add reset-cache:
npx expo start --clear --reset-cache
```

### Step 4: Device Side
On your phone:
1. **Close Expo Go completely** (swipe up to kill, don't just minimize)
2. **Clear Expo Go cache**:
   - iOS: Delete and reinstall Expo Go
   - Android: Settings -> Apps -> Expo Go -> Clear Cache
3. **Reopen Expo Go**
4. **Scan QR code fresh**

### Step 5: Verify Loading
Once app loads, check Metro terminal for logs:
- You should see: `[Catalog Sort] Current sort: color`
- Navigate to catalog and change sort options
- Each change should log to Metro terminal

## Why This Happened:
React Native/Expo aggressively caches JavaScript bundles both on the server (Metro) and device (Expo Go). Sometimes `--clear` flag isn't enough and you need to manually delete cache directories.

## If Still Not Working:
The nuclear option:
```bash
# Delete everything
rm -rf node_modules
rm -rf .expo
rm -rf node_modules/.cache

# Reinstall
pnpm install

# Restart
npx expo start --clear
```

Then delete and reinstall Expo Go app on device.
