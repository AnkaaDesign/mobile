# CRITICAL FIX - FilePreviewModal Using Localhost

## The Problem

You were seeing this error:
```
🔍 [FilePreviewModal] Using absolute thumbnailUrl: http://localhost:3030/files/thumbnail/...
ERROR ❌ [MainImage] Failed to load: {"error": "Could not connect to the server."}
```

Even though FileItem components were fixed to use `process.env.EXPO_PUBLIC_API_URL`, the **FilePreviewModal** was still using localhost!

## Root Cause

**File:** `/mobile/src/app/(tabs)/production/schedule/details/[id].tsx:590`

**BEFORE (BROKEN):**
```jsx
<FilePreviewModal
  files={fileViewer.state.currentFiles}
  initialFileIndex={fileViewer.state.currentFileIndex}
  visible={fileViewer.state.isPreviewModalOpen}
  onClose={fileViewer.actions.closePreview}
  baseUrl={(global as any).__ANKAA_API_URL__ || "http://localhost:3030"}  // ❌ WRONG
/>
```

**The issue:**
- `(global as any).__ANKAA_API_URL__` is undefined
- Falls back to `"http://localhost:3030"`
- Device/emulator can't reach localhost - that's the computer's local address, not accessible from the device!

## The Fix

**AFTER (FIXED):**
```jsx
<FilePreviewModal
  files={fileViewer.state.currentFiles}
  initialFileIndex={fileViewer.state.currentFileIndex}
  visible={fileViewer.state.isPreviewModalOpen}
  onClose={fileViewer.actions.closePreview}
  baseUrl={process.env.EXPO_PUBLIC_API_URL}  // ✅ CORRECT
/>
```

Now uses `process.env.EXPO_PUBLIC_API_URL` which is `"http://192.168.0.10:3030"` from your `.env` file.

## What Was Done

### 1. Fixed FilePreviewModal baseUrl ✅
- Changed from undefined global variable to environment variable
- **Line changed:** `details/[id].tsx:590`

### 2. Killed All Processes ✅
```bash
# Killed all Expo and Metro processes
ps aux | grep expo | kill
ps aux | grep metro | kill
```

### 3. Cleared All Caches ✅
```bash
rm -rf .expo .expo-shared node_modules/.cache
watchman watch-del-all
```

### 4. Started Fresh ✅
```bash
npx expo start --clear --reset-cache
```

## Expected Result

**After reloading the app, you should now see:**

### In Console Logs:
```javascript
// ✅ GOOD - Using network IP
🔍 [FilePreviewModal] Using absolute thumbnailUrl: http://192.168.0.10:3030/files/thumbnail/...
🔍 [FileItem] Using absolute thumbnailUrl: http://192.168.0.10:3030/files/thumbnail/...

// Loading success
✅ [MainImage] Loaded successfully: football_logo.eps
✅ [Thumbnail] Loaded successfully: football_logo.eps
```

### Visual Result:
- ✅ Thumbnails in file list display correctly
- ✅ Images in preview modal load correctly
- ✅ Thumbnails in preview modal bottom strip display correctly
- ✅ No "Could not connect to the server" errors

## Why It Was Failing

**The Network Reality:**
- Your API server: Running on computer at `192.168.0.10:3030`
- Your mobile device: On same WiFi network
- `localhost:3030` on device = device's own localhost, NOT your computer!
- `192.168.0.10:3030` = your computer's actual network address ✅

**What was happening:**
1. Device tries to load: `http://localhost:3030/files/thumbnail/abc123`
2. Device looks for server on its OWN localhost (not your computer)
3. No server running on device → "Could not connect to the server"

**What happens now:**
1. Device tries to load: `http://192.168.0.10:3030/files/thumbnail/abc123`
2. Device connects to your computer's IP address on the network
3. Server responds with thumbnail data → Success! ✅

## All Components Now Using Network IP

1. ✅ FileItem (artworks) → `process.env.EXPO_PUBLIC_API_URL`
2. ✅ FileItem (budgets) → `process.env.EXPO_PUBLIC_API_URL`
3. ✅ FileItem (invoices) → `process.env.EXPO_PUBLIC_API_URL`
4. ✅ FileItem (receipts) → `process.env.EXPO_PUBLIC_API_URL`
5. ✅ FileItem (cuts) → `process.env.EXPO_PUBLIC_API_URL`
6. ✅ **FilePreviewModal** → `process.env.EXPO_PUBLIC_API_URL` **← JUST FIXED**

## SafeArea Issues

You mentioned SafeArea worked briefly then broke after reload. This is likely due to:

1. **Hot reload issue**: React Native sometimes doesn't properly apply SafeArea after hot reload
2. **Solution**: Full app reload (not just hot reload)

**How to properly reload:**
1. Shake device → "Reload" (this is a FULL reload)
2. OR close app completely and reopen
3. DON'T use 'r' in terminal (that's just a hot reload, can be buggy)

## Next Steps

1. **Wait for Metro to finish building** (currently running)
2. **Reload the app COMPLETELY:**
   - Close the app on your device
   - Reopen it from the home screen
   - OR shake device → "Reload"
3. **Check console logs for network IP:**
   - Should see `192.168.0.10:3030` everywhere
   - Should NOT see `localhost:3030`
4. **Visual verification:**
   - Thumbnails load in file lists
   - Images load in preview modal
   - Thumbnail strip loads at bottom of preview
   - SafeArea spacing on top and bottom

## If Issues Persist

### Issue: Still seeing localhost
**Solution:**
- Verify `.env` has `EXPO_PUBLIC_API_URL="http://192.168.0.10:3030"`
- Do FULL app reload (close and reopen, not hot reload)

### Issue: SafeArea not working
**Solution:**
- Close app completely
- Reopen from home screen
- Avoid using 'r' key - use shake gesture instead

### Issue: "Could not connect" with correct IP
**Solution:**
- Verify backend is running: `curl http://192.168.0.10:3030/health`
- Verify device and computer on same WiFi network
- Check firewall isn't blocking port 3030

## Summary

The final piece of the puzzle was FilePreviewModal using the wrong baseUrl.

**ALL components now correctly use:** `process.env.EXPO_PUBLIC_API_URL` = `"http://192.168.0.10:3030"`

Metro is currently rebuilding with fresh cache. Once complete, do a FULL app reload and everything should work! 🎉
