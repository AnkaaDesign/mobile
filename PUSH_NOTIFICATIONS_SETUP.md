# Push Notifications Setup Guide

This document describes the Expo push notifications implementation for the Ankaa Design mobile app.

## Overview

The app uses Expo's push notification system to enable real-time notifications from the backend. The implementation includes:

- Push token registration with backend
- Notification handling (foreground, background, killed state)
- Deep linking from notifications
- Multiple notification channels (Android)
- Badge count management

## Installation

### 1. Install Required Packages

```bash
npm install expo-notifications expo-device
```

or

```bash
npx expo install expo-notifications expo-device
```

### 2. Rebuild the App

After installing the packages, rebuild your development build:

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

## File Structure

```
mobile/
├── src/
│   ├── lib/
│   │   └── notifications.ts              # Core notification utilities
│   ├── contexts/
│   │   └── push-notifications-context.tsx # Push notification state management
│   ├── api-client/
│   │   └── push-notifications.ts          # API endpoints for push tokens
│   └── app/
│       └── _layout.tsx                    # Provider integration
├── app.json                               # Expo notification configuration
└── assets/
    └── notification-icon.png              # Notification icon (optional)
```

## Configuration

### app.json

The app.json file includes notification configuration:

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#000000",
      "androidMode": "default",
      "androidCollapsedTitle": "{{unread_count}} new notifications"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#000000",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### Notification Icon (Optional)

Create a notification icon at `/assets/notification-icon.png`:
- Size: 96x96 pixels (mdpi)
- Format: PNG with transparent background
- Style: White icon on transparent background (Android will tint it)

## Usage

### Register for Push Notifications

The app automatically registers for push notifications when a user logs in. The `PushNotificationsProvider` handles this:

```typescript
import { usePushNotifications } from '@/contexts/push-notifications-context';

function MyComponent() {
  const { expoPushToken, isRegistered } = usePushNotifications();

  return (
    <View>
      <Text>Token: {expoPushToken}</Text>
      <Text>Registered: {isRegistered ? 'Yes' : 'No'}</Text>
    </View>
  );
}
```

### Manual Token Registration

```typescript
const { registerToken, unregisterToken } = usePushNotifications();

// Register
await registerToken();

// Unregister
await unregisterToken();
```

### Send Notifications from Backend

Use the Expo Push API to send notifications:

```typescript
// Backend example (Node.js)
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

const messages = [{
  to: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  sound: 'default',
  title: 'New Order',
  body: 'You have a new order #12345',
  data: {
    url: '/orders/12345',           // Deep link URL
    entityType: 'order',             // Entity type for auto-linking
    entityId: '12345'                // Entity ID for auto-linking
  },
  channelId: 'default',              // Android channel
  priority: 'high',
}];

const chunks = expo.chunkPushNotifications(messages);

for (const chunk of chunks) {
  try {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    console.log(ticketChunk);
  } catch (error) {
    console.error(error);
  }
}
```

## Notification Channels (Android)

The app creates three notification channels:

### 1. Default Channel
- ID: `default`
- Importance: DEFAULT
- Use for: Standard notifications

### 2. High Priority Channel
- ID: `high-priority`
- Importance: MAX
- Use for: Urgent notifications (alerts, emergencies)

### 3. Low Priority Channel
- ID: `low-priority`
- Importance: LOW
- Use for: Optional notifications (tips, news)

### Using Channels

Specify the channel when sending notifications:

```typescript
{
  to: token,
  title: 'Urgent Alert',
  body: 'System maintenance in 5 minutes',
  channelId: 'high-priority'  // Use high priority channel
}
```

## Deep Linking

Notifications can include deep links to navigate users to specific screens.

### URL Format

1. **Direct URL**: Provide a full path
   ```json
   { "data": { "url": "/orders/12345" } }
   ```

2. **Deep Link**: Use custom scheme
   ```json
   { "data": { "deepLink": "ankaadesign://orders/12345" } }
   ```

3. **Entity-Based**: Auto-generate link from entity type
   ```json
   {
     "data": {
       "entityType": "order",
       "entityId": "12345"
     }
   }
   ```

### Supported Routes

The deep linking system automatically maps notifications to app routes:
- Orders: `/orders/:id`
- Service Orders: `/service-orders/:id`
- Customers: `/customers/:id`
- Tasks: `/tasks/:id`
- Maintenance: `/maintenance/:id`

## Handling Notifications

### Foreground (App is Open)

The notification is received and displayed via the notification handler:

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### Background (App is Minimized)

Notifications appear in the system tray. Tapping opens the app and triggers navigation.

### Killed State (App is Closed)

When the app is launched by tapping a notification, the deep link is processed on startup.

## Badge Count

The app automatically manages badge counts:

```typescript
import { setBadgeCount, getBadgeCount } from '@/lib/notifications';

// Set badge count
await setBadgeCount(5);

// Get current badge count
const count = await getBadgeCount();

// Clear badge
await setBadgeCount(0);
```

## Testing

### 1. Test on Physical Device

Push notifications only work on physical devices, not simulators/emulators.

### 2. Get Push Token

Run the app and check the console for the push token:

```
Push token registered with backend: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

### 3. Send Test Notification

Use Expo's push notification tool:
https://expo.dev/notifications

Or use curl:

```bash
curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d '{
       "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
       "title": "Test Notification",
       "body": "This is a test",
       "data": { "url": "/dashboard" }
     }'
```

## Permissions

### iOS

The app will request permission when `registerForPushNotifications()` is called. Users must grant permission to receive notifications.

### Android

Notifications are enabled by default on Android 12 and below. On Android 13+, the app requests permission at runtime.

## Troubleshooting

### Token Not Generated

- Ensure you're testing on a physical device
- Check that notification permissions are granted
- Verify the Expo project ID in app.json matches your EAS project

### Notifications Not Received

- Check backend logs to ensure notifications are being sent
- Verify the push token is correct
- Ensure the app is not in Do Not Disturb mode
- Check notification channel settings (Android)

### Deep Links Not Working

- Verify the URL format in notification data
- Check that the route exists in the app
- Enable debug logging to see navigation attempts

### Badge Not Updating

- Call `setBadgeCount(0)` when appropriate (e.g., when viewing notifications)
- Ensure badge permissions are granted (iOS)

## Backend Requirements

Your backend needs to implement these endpoints:

### POST /push/register

Register a push token:

```typescript
{
  token: string;              // Expo push token
  deviceType: 'ios' | 'android';
  deviceId?: string;          // Optional device identifier
}
```

### DELETE /push/unregister

Unregister a push token:

```typescript
{
  token: string;  // Expo push token to remove
}
```

### PATCH /push/preferences

Update notification preferences:

```typescript
{
  enabled: boolean;
  categories?: string[];  // Which notification categories to receive
}
```

## Security

- Push tokens are tied to user accounts on the backend
- Tokens are automatically unregistered on logout
- Use HTTPS for all API communication
- Validate notification data on the backend before sending

## Performance

- Token registration happens automatically on login
- Tokens are cached locally to avoid re-registration
- Notification listeners are cleaned up when components unmount
- Badge count is cleared when app comes to foreground

## Future Enhancements

Potential improvements for the notification system:

1. **Notification Categories**: Allow users to configure which types of notifications they want
2. **Quiet Hours**: Respect user-defined quiet hours
3. **Rich Notifications**: Include images and action buttons
4. **Notification History**: Show a list of recent notifications
5. **Analytics**: Track notification delivery and engagement rates

## References

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notification Service](https://docs.expo.dev/push-notifications/overview/)
- [React Native Notifications Best Practices](https://reactnative.dev/docs/pushnotificationios)
