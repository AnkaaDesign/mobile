# Push Notification Issue - Root Cause Analysis

## Problem
Push notifications are not arriving on Android devices despite successful token registration.

## Root Cause Identified ✅

**TOKEN MISMATCH**: The mobile app is generating **Expo Push Tokens** (`ExponentPushToken[xxx]`), but the API is trying to send notifications via **Firebase Cloud Messaging (FCM)** directly, which requires **FCM device tokens**.

### The Conflict

#### Mobile App Behavior:
1. Uses `expo-notifications` library
2. Calls `Notifications.getExpoPushTokenAsync()`
3. Receives token format: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`
4. Sends this to API at `/notifications/device-token`

#### API Behavior:
1. Receives Expo token and stores it
2. When sending notification, calls `admin.messaging().send(message)`
3. **FCM expects a raw FCM token, not an Expo token**
4. **FCM rejects the Expo token** → notification fails silently

## Why This Happens

### Expo Push Tokens
- Format: `ExponentPushToken[...]`
- Used with Expo's push notification service
- Expo acts as intermediary between your server and FCM/APNS
- Simpler setup, works without Firebase config in mobile app

### FCM Tokens
- Format: Raw string without prefix
- Used directly with Firebase Cloud Messaging
- Requires `google-services.json` in mobile app
- Direct connection to FCM

## Evidence

###  Mobile App (`src/lib/notifications.ts`):
```typescript
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId,  // Expo project ID
});
return tokenData.data;  // Returns ExponentPushToken[xxx]
```

### API (`src/modules/common/push/push.service.ts`):
```typescript
// Tries to send with FCM directly
const messageId = await admin.messaging().send(message);
```

**This won't work!** FCM doesn't understand Expo tokens.

## Solution Options

### Option 1: Use Expo Push Service (Recommended for Standalone APK)
**Change API to use Expo's push service instead of FCM directly**

✅ **Pros:**
- Simpler configuration
- Mobile app already set up correctly
- No mobile app changes needed
- Handles both iOS and Android

❌ **Cons:**
- Adds Expo as intermediary
- Requires Expo access token
- Rate limited by Expo (free tier: 600 notifications/hour)

### Option 2: Use FCM Tokens Directly (Better for Production)
**Change mobile app to generate FCM tokens instead of Expo tokens**

✅ **Pros:**
- Direct FCM communication (more reliable)
- No rate limits
- More control
- Better for production

❌ **Cons:**
- Requires mobile app changes
- Need to rebuild APK
- More complex setup

### Option 3: Hybrid Approach (Best Long-term)
**Support both token types and route appropriately**

## Recommended Solution: Option 2 (FCM Direct)

Since you're building a standalone APK and want production-ready notifications, let's switch to FCM tokens directly.

## Implementation Steps

### Step 1: Install Firebase Messaging in Mobile App
```bash
npx expo install expo-notifications @react-native-firebase/app @react-native-firebase/messaging
```

### Step 2: Update Mobile Token Generation
Change from Expo tokens to FCM tokens

### Step 3: Update API Detection
API should validate token format and route correctly

### Step 4: Rebuild APK
New APK will generate FCM tokens

## Current State

### What's Working:
✅ Mobile app requests permissions
✅ Mobile app gets Expo push token
✅ Mobile app registers token with API
✅ API stores token in database
✅ Firebase Admin SDK initialized correctly
✅ API has valid Firebase credentials

### What's Not Working:
❌ API sends to FCM with Expo token format
❌ FCM rejects invalid token format
❌ Notifications never arrive

## Quick Test to Confirm

Run this on API console to see stored tokens:
```sql
SELECT token, platform, isActive, userId
FROM "DeviceToken"
WHERE isActive = true
LIMIT 5;
```

Expected: Tokens starting with `ExponentPushToken[`
Problem: API trying to send these to FCM directly

## Next Steps

1. Choose solution approach
2. Implement changes (I can do this)
3. Test with single device
4. Rebuild and deploy

Would you like me to implement Option 2 (FCM direct) or Option 1 (Expo push service)?
