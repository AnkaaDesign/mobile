# Debug Guide - File Viewer Issues

## What I Just Fixed

### 1. Main Image Loading - Added Detailed Logging ✅
**File:** `file-preview-modal.tsx:531-542`

Added logging to show exactly what URL is being used for the main image:
```javascript
🖼️ [MainImage] Loading with URL: {
  filename: "football_logo.eps",
  isEPS: true,
  hasThumbnailUrl: true,
  finalUrl: "http://192.168.0.10:3030/files/thumbnail/abc123?size=large"
}
```

### 2. SafeArea Padding - Manual Insets ✅
**File:** `file-preview-modal.tsx:474-478, 664-668`

Added manual padding using SafeArea insets:
```javascript
// Header (line 477)
{ paddingTop: insets.top + 12 }

// Thumbnail strip (line 667)
{ paddingBottom: insets.bottom + 12 }
```

### 3. SafeArea Insets Logging ✅
**File:** `file-preview-modal.tsx:79-90`

Added logging to show what insets are being used:
```javascript
📐 [FilePreviewModal] SafeArea Insets: {
  top: 47,
  bottom: 34,
  left: 0,
  right: 0,
  headerPadding: 59,  // top + 12
  thumbnailPadding: 46  // bottom + 12
}
```

---

## What to Check in Console

### When You Open a File

#### 1. Check SafeArea Insets
Look for this log when the modal opens:
```javascript
📐 [FilePreviewModal] SafeArea Insets: {
  top: 47,        // Should be > 0 on iPhone X+
  bottom: 34,     // Should be > 0 on iPhone X+ with home indicator
  headerPadding: 59,
  thumbnailPadding: 46
}
```

**What to verify:**
- `top` should be > 20 on devices with notch (iPhone X and newer)
- `bottom` should be > 0 on devices with home indicator
- If both are 0, SafeArea context isn't working

#### 2. Check Main Image URL
Look for this log when image loads:
```javascript
🖼️ [MainImage] Loading with URL: {
  filename: "football_logo.eps",
  isEPS: true,
  hasThumbnailUrl: true,
  finalUrl: "http://192.168.0.10:3030/files/thumbnail/abc123?size=large"
}
```

**What to verify:**
- ✅ URL should use `192.168.0.10:3030`, NOT `localhost:3030`
- For **EPS files with thumbnail**: URL should be `/files/thumbnail/{id}?size=large`
- For **regular images** (JPG, PNG, etc.): URL should be `/files/serve/{id}`
- For **EPS without thumbnail**: Should show file preview UI, not image

#### 3. Check URL Correction
Look for these logs:
```javascript
🔍 [getFileThumbnailUrl] Called with: {
  filename: "football_logo.eps",
  baseUrl: "http://192.168.0.10:3030",
  apiUrl: "http://192.168.0.10:3030",
  fileThumbnailUrl: "http://localhost:3030/files/thumbnail/abc123"
}

🔍 [FilePreviewModal] Corrected thumbnailUrl: {
  original: "http://localhost:3030/files/thumbnail/abc123",
  corrected: "http://192.168.0.10:3030/files/thumbnail/abc123"
}
```

**What to verify:**
- `baseUrl` and `apiUrl` should be `192.168.0.10:3030`
- If `baseUrl` is `undefined`, environment variable not loading
- Should see "Corrected thumbnailUrl" showing localhost → network IP replacement

---

## Troubleshooting

### Issue 1: Main Image Not Loading

**Symptoms:**
- Shows "Erro ao carregar" message
- Shows loading spinner indefinitely
- Error in console

**Check Console For:**
```javascript
❌ [MainImage] Failed to load: {
  filename: "...",
  url: "http://...",
  error: { ... }
}
```

**Possible Causes:**

#### A. Using Localhost
```javascript
// BAD
finalUrl: "http://localhost:3030/files/..."
```
**Solution:** Check that baseUrl is being passed correctly to FilePreviewModal

#### B. Wrong Endpoint for File Type
```javascript
// For EPS with thumbnail - should use thumbnail endpoint
isEPS: true,
hasThumbnailUrl: true,
finalUrl: "http://192.168.0.10:3030/files/thumbnail/abc123?size=large"  ✅

// For regular image - should use serve endpoint
isEPS: false,
finalUrl: "http://192.168.0.10:3030/files/serve/abc123"  ✅
```

#### C. File Doesn't Exist on Backend
**Test:**
1. Copy the URL from console log
2. Paste in browser
3. If browser can't load it → backend issue
4. If browser loads it → React Native Image issue

### Issue 2: Close Button Touching Status Bar

**Check Console For:**
```javascript
📐 [FilePreviewModal] SafeArea Insets: {
  top: 0,     // ❌ PROBLEM if device has notch
  bottom: 0,
  ...
}
```

**If insets.top is 0 on device with notch:**
- SafeAreaProvider not wrapping app
- Check `_layout.tsx` has SafeAreaProvider

**If insets.top is correct (e.g., 47) but button still touching:**
- Look at header element in dev tools
- Verify `paddingTop: 59` (insets.top + 12) is being applied
- Check if any other styles are overriding padding

### Issue 3: Thumbnails Display But Main Image Doesn't

**This means:**
- ✅ FileItem URL correction is working (thumbnails load)
- ❌ FilePreviewModal URL logic has issue

**Check:**
```javascript
// Thumbnails (working)
🔍 [FileItem] Corrected thumbnailUrl: {
  original: "http://localhost:3030/...",
  corrected: "http://192.168.0.10:3030/..."
}

// Main image (check this)
🖼️ [MainImage] Loading with URL: {
  finalUrl: "???"  // What is this?
}
```

**If finalUrl still shows localhost:**
- getFileUrl or getFileThumbnailUrl correction not working
- Check that baseUrl prop is passed to FilePreviewModal

---

## Expected Behavior

### For Regular Images (JPG, PNG, etc.)
1. **Thumbnail in list**: `http://192.168.0.10:3030/files/thumbnail/{id}?size=medium`
2. **Main image in viewer**: `http://192.168.0.10:3030/files/serve/{id}`

### For EPS Files WITH thumbnailUrl
1. **Thumbnail in list**: `http://192.168.0.10:3030/files/thumbnail/{id}?size=medium`
2. **Main image in viewer**: `http://192.168.0.10:3030/files/thumbnail/{id}?size=large`

### For EPS Files WITHOUT thumbnailUrl
1. **Thumbnail in list**: Shows file type icon (no image)
2. **Main image in viewer**: Shows "Visualização não disponível" with download/open buttons

---

## What to Report

When you open a file, copy these logs and send them:

1. **SafeArea insets:**
```
📐 [FilePreviewModal] SafeArea Insets: { ... }
```

2. **Main image URL:**
```
🖼️ [MainImage] Loading with URL: { ... }
```

3. **Any errors:**
```
❌ [MainImage] Failed to load: { ... }
```

4. **Screenshot showing:**
   - Where close button is positioned
   - Whether main image loads or shows error
   - Whether thumbnails display

This will tell me exactly what's happening!
