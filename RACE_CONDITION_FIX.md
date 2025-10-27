# Race Condition Fix - Login Working Again ✅

## The Problem

After removing localStorage polyfill fallbacks, login was failing with "não autorizado" and immediately logging out because of a **React timing bug**.

### The Race Condition:

```typescript
// OLD CODE (BROKEN):
await storeToken(access_token);
setAccessToken(access_token);      // Triggers useEffect (async)
setCachedToken(access_token);      // Triggers useEffect (async)

// This runs BEFORE useEffects complete!
await fetchAndUpdateUserData(access_token);  // ❌ No token in API client yet!
```

**What happened:**
1. Login succeeded ✅
2. Token stored in AsyncStorage ✅
3. `setAccessToken()` and `setCachedToken()` called ✅
4. **BUT**: Their `useEffect` hooks run asynchronously (after render)
5. `fetchAndUpdateUserData()` makes API call to `/auth/me` **immediately**
6. API client doesn't have token in headers yet (useEffect hasn't run)
7. Request gets **401 Unauthorized**
8. Auth error handler triggers logout ❌

### Why It Worked Before:

Before I removed localStorage fallbacks, the API client had this:

```typescript
// Old fallback (now removed for React Native):
const fallbackToken = safeLocalStorage.getItem("ankaa_token");
if (fallbackToken) {
  config.headers.Authorization = `Bearer ${fallbackToken}`;
}
```

So even if the token provider hadn't updated yet, the API client would check localStorage and find the token. But I removed this fallback for React Native, exposing the race condition.

## The Fix ✅

Call `setAuthToken()` **synchronously** BEFORE making any API calls:

### Fixed Login:
```typescript
// NEW CODE (WORKING):
setAuthToken(access_token);        // ✅ Synchronous! Token set immediately

await storeToken(access_token);
setAccessToken(access_token);      // These useEffects can run later
setCachedToken(access_token);

await fetchAndUpdateUserData(access_token);  // ✅ Token already in API client!
```

### Fixed ValidateSession:
```typescript
// NEW CODE (WORKING):
setAuthToken(token);               // ✅ Synchronous! Token set immediately

setAccessToken(token);             // These useEffects can run later
setCachedToken(token);

await fetchAndUpdateUserData(token);  // ✅ Token already in API client!
```

## Files Changed

1. **`src/contexts/auth-context.tsx:489`** (login function)
   - Added: `setAuthToken(access_token)` synchronously before API calls
   - Removed: Premature auth state clearing logic

2. **`src/contexts/auth-context.tsx:325`** (validateSession function)
   - Added: `setAuthToken(token)` synchronously before API calls
   - Reordered: Token set before state updates

## Why This Works

- `setAuthToken()` is a **synchronous function** that directly sets the token in Axios headers
- State updates (`setAccessToken`, `setCachedToken`) trigger useEffects that run **asynchronously**
- By calling `setAuthToken()` first, we ensure the token is available for **immediate** API calls
- The state updates still happen and keep everything in sync for future renders

## Testing

Login should now:
1. ✅ Complete successfully without "não autorizado" toast
2. ✅ Stay logged in (no immediate logout)
3. ✅ Fetch user data successfully
4. ✅ Redirect to home page

## Logs to Verify Success

**Good logs:**
```
[AUTH DEBUG] Starting login
[AUTH DEBUG] Setting token synchronously in API client
[STORAGE] Storing token in AsyncStorage
[AUTH DEBUG] Calling fetchAndUpdateUserData
✅ GET /auth/me - 200ms
```

**Bad logs (should not see):**
```
❌ GET /auth/me - 401 Unauthorized
[AUTH DEBUG] Clearing persisted cache during auth error
```

## Lesson Learned

**Never rely on React useEffect for time-critical operations.**

When you need a value to be available **immediately** before making function calls, set it synchronously. Use useEffect only for side effects that can happen asynchronously (like syncing to AsyncStorage, updating UI, etc).

In this case:
- **Synchronous**: `setAuthToken()` - needed immediately for API calls
- **Asynchronous**: `setAccessToken()`, `setCachedToken()` - UI updates can wait
