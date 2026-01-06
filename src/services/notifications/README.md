# Background Notification Handling Service

Comprehensive notification management system for the mobile app with support for background processing, deep linking, custom sounds, and vibration patterns.

## Features

- **Permission Management**: Request and manage notification permissions
- **Device Token Management**: Handle Expo and native push tokens
- **Notification Categories (iOS)**: Interactive notification buttons
- **Background Sync**: Periodic notification fetching even when app is closed
- **Local Notifications**: Schedule notifications with custom triggers
- **Deep Linking**: Navigate to specific screens from notifications
- **Custom Sounds & Vibration**: Different feedback for different notification types
- **Badge Management**: Automatic badge count updates
- **Notification Grouping (Android)**: Group related notifications

## Installation

Required packages (add to `package.json`):

```json
{
  "dependencies": {
    "expo-notifications": "~0.28.0",
    "expo-background-fetch": "~13.0.0",
    "expo-task-manager": "~12.0.0",
    "expo-haptics": "~15.0.0",
    "expo-linking": "~8.0.0"
  }
}
```

Install packages:

```bash
npm install
```

## Configuration

### 1. App Config (`app.json`)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": [
            "./assets/sounds/urgent.wav",
            "./assets/sounds/success.wav",
            "./assets/sounds/warning.wav"
          ]
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "remote-notification",
          "fetch"
        ]
      }
    },
    "android": {
      "useNextNotificationsApi": true,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    }
  }
}
```

### 2. Sound Files

Place custom notification sounds in `assets/sounds/`:

- `urgent.wav` - For urgent/critical notifications
- `success.wav` - For success notifications
- `warning.wav` - For warning notifications
- `task.wav` - For task updates
- `order.wav` - For order updates
- `message.wav` - For messages

## Usage

### Basic Setup

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function App() {
  const {
    permissions,
    deviceToken,
    isInitialized,
    requestPermissions,
    updateBadge,
  } = useNotifications({
    userId: currentUser?.id,
    autoInitialize: true,
    enableBackgroundSync: true,
    onNotificationReceived: (notification) => {
      console.log('Notification received:', notification);
    },
    onNotificationTapped: (response) => {
      console.log('Notification tapped:', response);
    },
  });

  // Request permissions if not granted
  useEffect(() => {
    if (permissions && !permissions.granted && permissions.canAskAgain) {
      requestPermissions();
    }
  }, [permissions]);

  return <YourApp />;
}
```

### Scheduling Local Notifications

```typescript
import {
  scheduleTaskNotification,
  scheduleOrderNotification,
  scheduleLocalNotification,
} from '@/services/notifications';

// Schedule a task notification
const notificationId = await scheduleTaskNotification(
  'task-123',
  'Task Due Soon',
  'Your task is due in 1 hour',
  new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
);

// Schedule an order notification
await scheduleOrderNotification(
  'order-456',
  'Order Delivered',
  'Your order has been delivered',
  new Date()
);

// Schedule custom notification
await scheduleLocalNotification(
  {
    title: 'Custom Notification',
    body: 'This is a custom notification',
    data: {
      screen: 'CustomScreen',
      params: { id: '123' },
    },
  },
  new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
);
```

### Background Sync

```typescript
import { backgroundSyncService } from '@/services/notifications';

// Initialize background sync
await backgroundSyncService.initialize(userId);

// Trigger manual sync
await backgroundSyncService.triggerManualSync(userId);

// Check sync status
const status = await backgroundSyncService.getBackgroundFetchStatus();

// Unregister when user logs out
await backgroundSyncService.unregisterBackgroundSync();
```

### Custom Notification Handlers

```typescript
import { notificationHandlerService } from '@/services/notifications';

// Register custom action handler
notificationHandlerService.registerActionHandler('approve', async (data, notification) => {
  // Handle approval action
  await approveRequest(data.entityId);
  console.log('Request approved');
});

// Register custom action handler for rejection
notificationHandlerService.registerActionHandler('reject', async (data, notification) => {
  // Handle rejection action
  await rejectRequest(data.entityId);
  console.log('Request rejected');
});

// Set default handler for unhandled actions
notificationHandlerService.setDefaultHandler(async (data) => {
  // Default behavior - navigate to detail screen
  console.log('Default handler:', data);
});
```

### Notification Categories (iOS)

```typescript
import { notificationCategoriesService } from '@/services/notifications';

// Categories are automatically initialized with default actions
// Available categories:
// - task-update: View, Remind Later, Mark Read
// - order-update: View, Dismiss
// - ppe-request: Approve, Reject, View Details
// - vacation-request: Approve, Reject, View Details
// - stock-alert: View, Remind Later
// - general: View, Dismiss

// Register custom category
await notificationCategoriesService.registerCategory(
  'custom-category',
  [
    {
      identifier: 'custom-action',
      buttonTitle: 'Custom Action',
      options: { opensAppToForeground: true },
    },
  ],
  {
    previewPlaceholder: 'Custom Notification',
  }
);
```

### Badge Management

```typescript
import { updateBadgeCount, clearBadge } from '@/services/notifications';

// Update badge count
await updateBadgeCount(5);

// Clear badge
await clearBadge();

// Or use the hook
const { updateBadge, clearBadge } = useNotifications();
await updateBadge(5);
await clearBadge();
```

### Unread Notification Count

```typescript
import { useUnreadNotificationCount } from '@/hooks/useNotifications';

function NotificationBadge() {
  const { count, isLoading, refresh } = useUnreadNotificationCount(
    userId,
    60000 // Refresh every 60 seconds
  );

  return (
    <View>
      {count > 0 && <Badge count={count} />}
      <Button onPress={refresh} title="Refresh" />
    </View>
  );
}
```

### Sound and Vibration

```typescript
import {
  triggerNotificationHaptic,
  triggerSuccessHaptic,
  soundVibrationService,
} from '@/services/notifications';
import { NOTIFICATION_IMPORTANCE } from '@/constants';

// Trigger haptic for notification
await triggerNotificationHaptic(NOTIFICATION_IMPORTANCE.URGENT);

// Trigger success haptic
await triggerSuccessHaptic();

// Disable haptics
soundVibrationService.enableHaptics(false);

// Disable sounds
soundVibrationService.enableSounds(false);
```

### Android Notification Channels

```typescript
import { createNotificationChannel, NOTIFICATION_SOUNDS } from '@/services/notifications';
import * as Notifications from 'expo-notifications';

// Create custom channel
await createNotificationChannel(
  'custom-channel',
  'Custom Channel',
  Notifications.AndroidImportance.HIGH,
  {
    sound: NOTIFICATION_SOUNDS.URGENT,
    vibrationPattern: [0, 100, 50, 100, 50, 100],
    enableLights: true,
    lightColor: '#FF0000',
    description: 'Custom notifications',
  }
);
```

## Notification Data Structure

### Deep Linking

```typescript
// Method 1: Direct URL
{
  url: 'ankaadesign://tasks/123'
}

// Method 2: Entity Type + ID (recommended)
{
  entityType: 'task',
  entityId: '123'
}

// Method 3: Screen + Params (legacy)
{
  screen: 'TaskDetail',
  params: { taskId: '123' }
}

// Full example
{
  url: 'ankaadesign://tasks/123',
  entityType: 'task',
  entityId: '123',
  notificationId: 'notif-456',
  screen: 'TaskDetail',
  params: { taskId: '123' }
}
```

## API Integration

### Send Push Notification from Backend

```typescript
// Backend (Node.js example)
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

const messages = [{
  to: deviceToken,
  sound: 'default',
  title: 'Task Update',
  body: 'Your task has been updated',
  data: {
    entityType: 'task',
    entityId: 'task-123',
    notificationId: 'notif-456',
  },
  categoryIdentifier: 'task-update', // iOS only
  priority: 'high',
  badge: 1,
}];

const chunks = expo.chunkPushNotifications(messages);
const tickets = [];

for (const chunk of chunks) {
  const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
  tickets.push(...ticketChunk);
}
```

### Register Device Token

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function RegisterToken() {
  const { deviceToken } = useNotifications();

  useEffect(() => {
    if (deviceToken) {
      // Send token to backend
      registerDeviceToken(userId, deviceToken.token);
    }
  }, [deviceToken]);
}
```

## Error Handling

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function App() {
  const { error, permissions } = useNotifications();

  useEffect(() => {
    if (error) {
      console.error('Notification error:', error);
      // Handle error - show alert, log to analytics, etc.
    }
  }, [error]);

  useEffect(() => {
    if (permissions && !permissions.granted) {
      // Show UI explaining why permissions are needed
      showPermissionExplanation();
    }
  }, [permissions]);
}
```

## Best Practices

1. **Request Permissions Contextually**: Don't request notification permissions immediately on app launch. Wait for a natural moment when the user understands the value.

2. **Handle Permission Denials**: Provide clear UI when permissions are denied and explain how to enable them in settings.

3. **Test Background Fetch**: Background fetch behavior varies by platform and device settings. Test thoroughly on physical devices.

4. **Manage Badge Count**: Update badge count whenever notifications change to keep it accurate.

5. **Deep Link Validation**: Always validate deep links and handle errors gracefully when navigation fails.

6. **Sound Files**: Keep sound files short (< 30 seconds) and in supported formats (wav, aiff, or caf for iOS).

7. **Haptic Feedback**: Use haptics sparingly to avoid annoying users. Reserve strong haptics for important notifications.

8. **Background Sync Interval**: Balance between freshness and battery usage. 15 minutes is a good default.

9. **Notification Grouping**: Group related notifications (especially on Android) to avoid overwhelming users.

10. **Clean Up**: Always unregister background tasks and remove listeners when the user logs out.

## Troubleshooting

### Notifications Not Appearing

1. Check permissions are granted
2. Verify device is physical (not simulator/emulator for push)
3. Check notification channels are created (Android)
4. Verify app is not in Do Not Disturb mode
5. Check background fetch is enabled in device settings

### Background Sync Not Working

1. Verify background fetch permissions
2. Check task is registered: `TaskManager.isTaskRegisteredAsync()`
3. Ensure app has background fetch capability enabled
4. Test on physical device (background fetch doesn't work reliably in simulators)
5. Check battery optimization settings (Android)

### Haptics Not Working

1. Verify device supports haptics
2. Check haptic settings in device
3. Ensure haptics are enabled in app settings

### Deep Links Not Working

1. Verify URL scheme is configured in app.json
2. Check deep link handler is properly set up
3. Validate URL format matches expected pattern
4. Check navigation service is properly initialized

## License

MIT
