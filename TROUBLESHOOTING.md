# Mobile File Viewer - Troubleshooting Guide

## ✅ Cache Cleared Successfully

The following caches have been cleared:
- ✅ Expo cache (`.expo`, `.expo-shared`)
- ✅ Metro bundler cache
- ✅ Watchman cache
- ✅ Node modules cache
- ✅ React types updated to correct version

## 🔄 Current Server Status

The development server is now running with a **completely fresh cache**.
Metro bundler is rebuilding from scratch.

## 📱 Next Steps to Test

### 1. **Delete App from Device/Simulator**

**iOS Simulator:**
```bash
# Option 1: Press and hold app icon → Delete App
# Option 2: Reset all simulators
xcrun simctl erase all
```

**Physical Device:**
- Long press the app icon
- Tap "Remove App"
- Select "Delete App"

### 2. **Reinstall Fresh**

```bash
# For iOS
npx expo run:ios --clear

# For Android
npx expo run:android --clear
```

### 3. **Verify File URLs**

Open the app and check the Network tab to see what URLs are being requested:

**Expected URLs (CORRECT):**
```
http://your-api-url:3030/files/serve/{file-id}
http://your-api-url:3030/files/thumbnail/{file-id}?size=medium
```

**Wrong URLs (if you see these, there's still a cache issue):**
```
http://your-api-url:3030/api/files/serve/{file-id}  ❌
http://your-api-url:3030/api/files/thumbnail/{file-id}  ❌
```

## 🔍 Debugging Steps

### Check 1: Verify Environment Variables

```bash
cat .env
```

Should show:
```
EXPO_PUBLIC_API_URL=http://your-api-url:3030
```

### Check 2: Test API Endpoints Directly

Open in browser or Postman:
```
http://your-api-url:3030/files/serve/{a-real-file-id}
```

If this works in browser but not in app → cache issue persists.

### Check 3: Enable Network Debugging

Add to your code temporarily:
```typescript
// In file-viewer.tsx or file-preview-modal.tsx
console.log('🔍 File URL:', getFileUrl(file));
console.log('🔍 API Base:', baseUrl || (global as any).__ANKAA_API_URL__);
```

### Check 4: React DevTools

Install React Native Debugger:
```bash
brew install --cask react-native-debugger
```

Check the Network tab to see actual requests.

## 🐛 Common Issues & Solutions

### Issue 1: "Text must be in <Text> component"

**Status:** ✅ FIXED
**Location:** FilePreviewModal error button row
**Fix Applied:** Added `errorButtonRow` wrapper style

### Issue 2: "Erro ao carregar imagem"

**Status:** ✅ FIXED
**Root Cause:** Wrong URL format with `/api` prefix
**Files Fixed:**
- `file-preview-modal.tsx`
- `file-item.tsx`
- `file-viewer.tsx`
- `utils/file.ts`

### Issue 3: Controls out of SafeArea

**Status:** ✅ FIXED
**Location:** FilePreviewModal container
**Fix Applied:** Wrapped in `<SafeAreaView edges={['top', 'bottom']}>`

## 🧪 Test Checklist

After reinstalling the app, test these scenarios:

### Images:
- [ ] Thumbnails load in grid view
- [ ] Thumbnails load in list view
- [ ] Full image loads in preview modal
- [ ] Pinch to zoom works
- [ ] Swipe between images works
- [ ] Rotation works

### File Actions:
- [ ] Tap "Abrir" → Opens file in system viewer
- [ ] Tap "Salvar" → Downloads file successfully
- [ ] "Baixar Todos" → Downloads all files

### UI:
- [ ] No text rendering errors
- [ ] Controls don't overlap notch/dynamic island
- [ ] Modal background is dark enough
- [ ] Safe areas respected on all devices

## 🔧 Nuclear Option: Complete Reset

If issues persist, run this complete reset:

```bash
# 1. Stop all processes
pkill -f expo
pkill -f metro

# 2. Delete everything
rm -rf node_modules
rm -rf .expo
rm -rf .expo-shared
rm -rf ios/build
rm -rf android/build
rm -rf android/.gradle

# 3. Clear all caches
watchman watch-del-all
npm cache clean --force
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*

# 4. Reinstall
npm install

# 5. Reset iOS simulator
xcrun simctl erase all

# 6. Start fresh
npx expo start --clear --reset-cache
```

## 📊 Verify Code Changes

Run this to verify the fixes are in place:

```bash
# Check file-preview-modal.tsx has correct URLs
grep -n "files/serve" src/components/file/file-preview-modal.tsx

# Check file-viewer.tsx has correct URLs
grep -n "files/serve" src/components/file/file-viewer.tsx

# Check file-item.tsx has correct URLs
grep -n "files/serve" src/components/file/file-item.tsx

# Should find lines with: `${apiUrl}/files/serve/${file.id}`
# Should NOT find: `/api/files/`
```

## 🎯 Expected Output

When everything is working correctly, you should see:

```
✅ Files/serve URLs (no /api prefix)
✅ Thumbnails loading
✅ Preview modal working
✅ No text component errors
✅ Safe areas respected
```

## 📞 Still Having Issues?

If problems persist after:
1. ✅ Clearing all caches
2. ✅ Deleting and reinstalling app
3. ✅ Verifying code changes are present
4. ✅ Checking network requests

Then the issue might be:
- Backend not returning correct file URLs
- Network connectivity between device and API
- CORS issues (if using web browser)
- File permissions on backend

Check backend logs to see if requests are reaching the server.
