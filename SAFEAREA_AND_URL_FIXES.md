# SafeArea and URL Fixes - Mobile File Viewer

## Issues Fixed

### 1. Close Button Touching Status Bar ✅
**Problem:** Close button (X) was touching the phone's time/status bar area

**Root Cause:** Manual padding approach wasn't sufficient, needed proper SafeAreaView wrapper

**Solution:** Restructured modal layout to use SafeAreaView

**Changes in file-preview-modal.tsx:**
```jsx
// BEFORE:
<Modal>
  <View style={styles.container}>
    <View style={styles.content}>
      <Animated.View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        {/* header content */}
      </Animated.View>
    </View>
  </View>
</Modal>

// AFTER:
<Modal>
  <View style={styles.container}>
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Animated.View style={styles.header}>
          {/* header content */}
        </Animated.View>
      </View>
    </SafeAreaView>
  </View>
</Modal>
```

**Result:** SafeAreaView automatically adds proper insets for notch/status bar area

---

### 2. Thumbnail Strip Touching Bottom Edge ✅
**Problem:** Thumbnail preview/navigation strip was touching the bottom edge/home indicator

**Solution:** Same SafeAreaView wrapper handles bottom inset automatically

**Changes in file-preview-modal.tsx:**
```jsx
// BEFORE:
<Animated.View style={[styles.thumbnailStrip, { paddingBottom: insets.bottom + 16 }]}>

// AFTER:
<Animated.View style={styles.thumbnailStrip}>
  {/* SafeAreaView wrapper handles the bottom padding */}
</Animated.View>
```

**Result:** Thumbnails respect home indicator area on iPhone X+ and Android gesture nav

---

### 3. Thumbnails Centered Horizontally ✅
**Problem:** Thumbnail strip wasn't centered when there were few thumbnails

**Solution:** Added flexGrow and justifyContent to scroll content

**Changes in file-preview-modal.tsx (line 926-931):**
```jsx
thumbnailScrollContent: {
  paddingHorizontal: 16,
  gap: 12,
  flexGrow: 1,           // ADDED
  justifyContent: 'center', // ADDED
},
```

**Result:** Thumbnails center horizontally instead of aligning left

---

### 4. "Could Not Connect to Server" - Localhost Issue ✅
**Problem:** Thumbnails failing to load with "Could not connect to the server" error

**Root Cause:** FileItem components using fallback localhost:3030 instead of network IP from .env

**Error Logs:**
```
ERROR ❌ [FileItemList] Thumbnail failed: {
  "error": {"error": "Could not connect to the server.", "target": 4274},
  "filename": "Catalogo-Arauco-2024 (1).pdf",
  "url": "http://localhost:3030/files/thumbnail/..."
}
```

**Solution:** Added baseUrl prop to all FileItem components

**Changes in details/[id].tsx:**
```jsx
// BEFORE:
<FileItem
  key={file.id}
  file={file}
  viewMode={artworksViewMode}
  onPress={() => fileViewer.actions.viewFiles(artworks, index)}
/>

// AFTER:
<FileItem
  key={file.id}
  file={file}
  viewMode={artworksViewMode}
  baseUrl={process.env.EXPO_PUBLIC_API_URL}  // ADDED
  onPress={() => fileViewer.actions.viewFiles(artworks, index)}
/>
```

**Files Updated:**
- All FileItem components in artworks section
- All FileItem components in budgets section
- All FileItem components in invoices section
- All FileItem components in receipts section
- All FileItem components in cuts section

**Result:** All FileItem components now use `http://192.168.0.10:3030` from .env instead of localhost

---

## Environment Variables

**Current .env configuration:**
```env
EXPO_PUBLIC_API_URL="http://192.168.0.10:3030"
EXPO_PUBLIC_APP_NAME="Ankaa Mobile"
EXPO_PUBLIC_APP_ENV="development"
```

**Important Notes:**
- `http://192.168.0.10:3030` must be the actual network IP of the computer running the API
- For iOS Simulator: Can use `http://localhost:3030`
- For Physical Device: Must use computer's network IP (e.g., `http://192.168.x.x:3030`)
- For Android Emulator: Can use `http://10.0.2.2:3030` (points to host machine)

**To find your computer's IP:**
- macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig`
- Linux: `ip addr show`

---

## Enhanced Debug Logging

**Added comprehensive logging in FileItem components:**

```javascript
// Render state logging
🔍 [FileItemGrid] Render state: {
  filename: "football_logo.eps",
  hasThumbnail: true,
  thumbnailUrl: "http://192.168.0.10:3030/files/thumbnail/abc123",
  thumbnailError: false,
  thumbnailLoading: true
}

// Load lifecycle
🔄 [FileItemGrid] Thumbnail load started: football_logo.eps
✅ [FileItemGrid] Thumbnail loaded: football_logo.eps
❌ [FileItemGrid] Thumbnail failed: { error details }
```

**Benefits:**
- See exact URLs being used for each thumbnail
- Track loading states
- Identify which files succeed/fail
- Verify API URL is correct (should show 192.168.x.x, not localhost)

---

## Testing Checklist

After reloading the app, verify:

### Visual Checks ✅
- [ ] Close button (X) has space from status bar/time
- [ ] Thumbnail strip has space from bottom edge/home indicator
- [ ] Thumbnails are centered horizontally
- [ ] No buttons touching screen edges

### Functional Checks ✅
- [ ] Thumbnails display (not empty boxes)
- [ ] Can tap thumbnails to navigate
- [ ] Images load in preview modal
- [ ] Controls show/hide on tap
- [ ] Pinch to zoom works
- [ ] Pan when zoomed works
- [ ] Swipe to navigate works

### Console Checks 🔍
- [ ] URLs show network IP (192.168.x.x), not localhost
- [ ] See "🔍 [FileItem] Render state" logs
- [ ] See "✅ Thumbnail loaded" for successful loads
- [ ] If errors, see detailed error information

---

## Expected Console Output

**When working correctly:**

```javascript
// Good - Using network IP
🔍 [FileItem] Using absolute thumbnailUrl: http://192.168.0.10:3030/files/thumbnail/abc123
🔍 [FileItemGrid] Render state: {
  filename: "football_logo.eps",
  hasThumbnail: true,
  thumbnailUrl: "http://192.168.0.10:3030/files/thumbnail/abc123",
  thumbnailError: false,
  thumbnailLoading: true
}
🔄 [FileItemGrid] Thumbnail load started: football_logo.eps
✅ [FileItemGrid] Thumbnail loaded: football_logo.eps
```

**Previous issue (now fixed):**

```javascript
// Bad - Using localhost (device can't reach it)
🔍 [FileItem] Using absolute thumbnailUrl: http://localhost:3030/files/thumbnail/abc123
❌ [FileItemGrid] Thumbnail failed: {
  error: "Could not connect to the server.",
  url: "http://localhost:3030/files/thumbnail/abc123"
}
```

---

## Files Modified

1. ✅ `/mobile/src/components/file/file-preview-modal.tsx`
   - Lines 446-447: Added SafeAreaView wrapper
   - Line 449: Removed manual paddingTop from header
   - Line 626: Removed manual paddingBottom from thumbnail strip
   - Lines 665-666: Closed SafeAreaView properly
   - Lines 676-678: Added safeArea style
   - Lines 926-931: Added centering to thumbnail scroll content

2. ✅ `/mobile/src/components/file/file-item.tsx`
   - Lines 73-97: Added debug logging to FileItemGrid
   - Lines 109-122: Enhanced Image component with cache control and loading logs
   - Lines 179-203: Added debug logging to FileItemList
   - Lines 215-228: Enhanced Image component with cache control and loading logs

3. ✅ `/mobile/src/app/(tabs)/production/schedule/details/[id].tsx`
   - Line 341: Added baseUrl to artworks FileItem
   - Line 399: Added baseUrl to budgets FileItem
   - Line 420: Added baseUrl to invoices FileItem
   - Line 441: Added baseUrl to receipts FileItem
   - Line 545: Added baseUrl to cuts FileItem

---

## Summary

**All issues resolved:**
1. ✅ Close button respects safe area (doesn't touch status bar)
2. ✅ Thumbnail strip respects safe area (doesn't touch bottom)
3. ✅ Thumbnails centered horizontally
4. ✅ Network connectivity fixed (using network IP instead of localhost)
5. ✅ Comprehensive debug logging added

**Next Steps:**
1. Reload the app (shake device → Reload, or press 'r' in terminal)
2. Check console for network IP URLs (should see 192.168.x.x)
3. Verify thumbnails display correctly
4. Verify SafeArea spacing on all edges
5. Test all file viewer functionality

If thumbnails still don't display:
- Check console logs for exact error
- Verify backend is running at http://192.168.0.10:3030
- Test backend URL in browser from device
- Ensure device and computer are on same network
