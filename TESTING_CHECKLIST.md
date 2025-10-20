# 🧪 Mobile File Viewer - Testing Checklist

## ✅ Fixes Applied

### 1. **Text Component Error** - FIXED ✅
**Issue:** Badge received multiple children instead of single string
**Fix:** Changed `{currentImageIndex + 1} de {totalImages}` to `` {`${currentImageIndex + 1} de ${totalImages}`} ``
**Location:** `file-preview-modal.tsx:447`

### 2. **SafeArea Issues** - FIXED ✅
**Issue:** Controls touching top (time area) and bottom of screen
**Fix:** Restructured modal layout with proper SafeAreaView nesting
**Changes:**
- Wrapped content in `<SafeAreaView edges={['top', 'bottom']}>`
- Background as absolute positioned View outside SafeArea
- Content respects safe insets

### 3. **Debug Logging Added** - READY 🔍
**Added console.log statements to track:**
- File URLs being generated
- API base URL being used
- Thumbnail URL construction
- Which files have/don't have thumbnails

---

## 📱 How to Test

### Step 1: Check Console Logs

When you tap on a file, you should see in the console:

```javascript
🔍 [FileItem] Constructed thumbnail URL: {
  filename: "football_logo.eps",
  url: "http://YOUR-API:3030/files/thumbnail/abc123?size=medium"
}

🔍 [FilePreviewModal] getFileUrl: {
  filename: "football_logo.eps",
  fileId: "abc123",
  baseUrl: "http://YOUR-API:3030",
  globalUrl: "http://YOUR-API:3030",
  finalUrl: "http://YOUR-API:3030/files/serve/abc123"
}
```

### Step 2: Verify URL Format

**✅ CORRECT URLs (should see these):**
```
http://your-api:3030/files/serve/{id}
http://your-api:3030/files/thumbnail/{id}?size=medium
```

**❌ WRONG URLs (should NOT see these):**
```
http://your-api:3030/api/files/serve/{id}  ❌ Has /api prefix
undefined/files/serve/{id}  ❌ API URL is undefined
http://localhost:3030/files/serve/{id}  ❌ Using localhost instead of actual API
```

### Step 3: Check Errors

If you still see "Erro ao carregar", check:

1. **Is the API URL correct?**
   - Check console for `baseUrl` and `globalUrl` values
   - Should be your actual API server, not localhost (unless testing on simulator)

2. **Can you access the file in browser?**
   - Copy the URL from console
   - Paste in browser
   - File should download/display

3. **Is the file ID valid?**
   - Check console for `fileId`
   - Should be a valid UUID or database ID

---

## 🐛 Troubleshooting

### Issue: Thumbnails still showing empty boxes

**Check Console For:**
```javascript
⚠️ [FileItem] No thumbnail URL for file: {
  filename: "football_logo.eps",
  mimetype: "application/postscript"
}
```

**Possible Causes:**
1. EPS files don't have `thumbnailUrl` property set
2. File is not recognized as image type
3. Backend hasn't generated thumbnails

**Solution:**
- Check if `file.thumbnailUrl` exists in the data
- Check if backend generates thumbnails for EPS files
- May need to add EPS to image extensions list

### Issue: API URL is undefined

**Check Console For:**
```javascript
baseUrl: undefined
globalUrl: undefined
```

**Solution:**
1. Check `.env` file:
   ```
   EXPO_PUBLIC_API_URL=http://your-api:3030
   ```

2. Restart dev server:
   ```bash
   npx expo start --clear
   ```

3. Check `_layout.tsx` passes baseUrl:
   ```tsx
   <FileViewerProvider baseUrl={process.env.EXPO_PUBLIC_API_URL}>
   ```

### Issue: Images load in browser but not in app

**Possible Causes:**
1. CORS issue (unlikely for React Native)
2. File permissions on backend
3. SSL certificate issues (if using HTTPS)
4. Network request blocked by firewall

**Debug:**
```javascript
// Add error handler logging
onError={(error) => {
  console.error('Image load error:', error);
}}
```

---

## 📋 Test Each Section

### ✅ Recortes (Cuts) Section
- [ ] Navigate to Task Details
- [ ] Scroll to "Recortes" section
- [ ] Check console for thumbnail URLs
- [ ] Verify thumbnails display (not empty boxes)
- [ ] Tap on a file
- [ ] Preview modal opens
- [ ] Image loads correctly
- [ ] Controls don't touch top/bottom

### ✅ Documents Section
- [ ] Check "Recibos" section
- [ ] File displays in list
- [ ] Tap to open
- [ ] File opens in system viewer OR
- [ ] Preview shows if supported

### ✅ SafeArea
- [ ] Open any file preview
- [ ] Check close button (X) doesn't touch time area
- [ ] Check thumbnail strip doesn't touch home indicator
- [ ] Controls have proper padding

### ✅ Text Components
- [ ] No error at bottom of screen
- [ ] Image counter shows "1 de 2" correctly
- [ ] All text is readable

---

## 🎯 Expected Console Output

When working correctly, you should see:

```javascript
// On TaskDetails page load
🔍 [FileItem] Constructed thumbnail URL: {
  filename: "football_logo.eps",
  url: "http://192.168.1.100:3030/files/thumbnail/uuid-1234?size=medium"
}

// When tapping a file
🔍 [FilePreviewModal] getFileUrl: {
  filename: "football_logo.eps",
  fileId: "uuid-1234",
  baseUrl: "http://192.168.1.100:3030",
  globalUrl: "http://192.168.1.100:3030",
  finalUrl: "http://192.168.1.100:3030/files/serve/uuid-1234"
}

// If EPS with thumbnail
🔍 [FilePreviewModal] Constructed thumbnail URL: http://192.168.1.100:3030/files/thumbnail/uuid-1234?size=large

// If regular image
🔍 [FilePreviewModal] Using serve URL for image: http://192.168.1.100:3030/files/serve/uuid-5678
```

---

## 🔧 Quick Fixes

### If API URL is wrong:
1. Update `.env`
2. Kill dev server
3. Clear cache: `./clear-cache.sh`
4. Restart: `npx expo start --clear`
5. Delete and reinstall app

### If thumbnails don't exist:
Backend needs to generate thumbnails. Check backend logs.

### If files load but thumbnails don't:
The files might not have the `thumbnailUrl` property set. Check the API response data.

---

## 📞 Next Steps

After testing, report back:
1. What URLs appear in console?
2. Do thumbnails display or still empty?
3. Does preview modal work?
4. Are controls in safe areas?
5. Any error messages?

This will help diagnose the exact issue!
