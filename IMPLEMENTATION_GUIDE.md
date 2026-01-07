# MessageModal Implementation Guide

This guide explains how to integrate the new MessageModal component into your mobile application.

## Overview

The MessageModal is a native-feeling modal component that displays unviewed messages to users. It includes:

- Automatic display on first mount when unviewed messages exist
- Swipe gestures for navigation between messages
- Mark as read functionality
- "Don't show again" option for permanent dismissal
- Smooth animations and haptic feedback
- Safe area handling for notches and home indicators

## Files Created

### Component Files
1. `/mobile/src/components/message/MessageModal.tsx` - Main modal component
2. `/mobile/src/components/message/MessageModalIntegration.tsx` - Ready-to-use integration
3. `/mobile/src/components/message/MessageModalIntegration.example.tsx` - Usage examples
4. `/mobile/src/components/message/index.ts` - Exports
5. `/mobile/src/components/message/README.md` - Component documentation

### Hook Files
6. `/mobile/src/hooks/useUnviewedMessages.ts` - Hook for managing unviewed messages

## Quick Start

### Step 1: Add to Your App Layout

Open your root layout file (e.g., `/mobile/src/app/_layout.tsx`) and add the MessageModal:

```tsx
import { MessageModalProvider } from "@/components/message";

export default function RootLayout() {
  // Get user ID from your auth context
  const { user } = useAuth(); // Adjust based on your auth implementation

  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      {/* Add the MessageModal at the root level */}
      <MessageModalProvider
        userId={user?.id}
        autoShow={true}
        debug={false}
      />
    </ThemeProvider>
  );
}
```

### Step 2: That's It!

The modal will automatically:
- Fetch unread notifications for the user
- Show on first mount if there are unviewed messages
- Allow swiping between messages
- Mark messages as read when requested
- Persist dismissed messages across app restarts

## Configuration Options

### MessageModalProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userId` | `string` | `undefined` | User ID to fetch messages for (required) |
| `autoShow` | `boolean` | `true` | Auto-show modal on first mount if messages exist |
| `maxMessages` | `number` | `50` | Maximum number of messages to fetch |
| `debug` | `boolean` | `false` | Enable debug logging to console |

## Advanced Usage

### Manual Control

If you want to control when the modal shows:

```tsx
import { useUnviewedMessages } from "@/hooks/useUnviewedMessages";
import { MessageModal } from "@/components/message";

function MyComponent() {
  const { user } = useAuth();

  const {
    unviewedMessages,
    showModal,
    openModal,
    closeModal,
    markAsRead,
    markAllAsRead,
    dontShowAgain,
  } = useUnviewedMessages({
    userId: user?.id,
    autoShow: false, // Disable auto-show
    fetchMessages: async () => {
      const response = await getUnreadNotifications(user.id);
      return response.data || [];
    },
  });

  return (
    <>
      <Button onPress={openModal}>
        View Messages ({unviewedMessages.length})
      </Button>

      <MessageModal
        visible={showModal}
        onClose={closeModal}
        messages={unviewedMessages}
        onMarkAsRead={(id) => markAsRead(id)}
        onMarkAllAsRead={markAllAsRead}
        onDontShowAgain={(id) => dontShowAgain(id)}
      />
    </>
  );
}
```

### Custom Message Fetching

You can customize how messages are fetched:

```tsx
const { unviewedMessages } = useUnviewedMessages({
  userId: user?.id,
  fetchMessages: async () => {
    const response = await getUnreadNotifications(user.id, {
      limit: 100,
      orderBy: { importance: "desc", sentAt: "desc" },
      // Add custom filters
      where: {
        type: "IMPORTANT",
      },
    });

    // Transform or filter messages as needed
    return response.data || [];
  },
});
```

## How It Works

### Data Flow

1. **Fetch Messages**: The hook calls `fetchMessages()` on mount and when userId changes
2. **Filter Unviewed**: Messages are filtered to exclude dismissed and viewed messages
3. **Auto-Show**: If `autoShow` is true and there are unviewed messages, modal shows
4. **User Actions**: User can mark as read, mark all as read, or dismiss permanently
5. **Persistence**: Dismissed and viewed message IDs are stored in AsyncStorage
6. **Server Sync**: Actions are synced with the server via the notification API

### Storage Keys

- `@ankaa/dismissed_messages`: Array of message IDs that user chose "don't show again"
- `@ankaa/viewed_messages`: Array of message IDs that user marked as read

### API Integration

The component uses the existing notification API:

```tsx
import {
  getUnreadNotifications,  // Fetch unread messages
  markAsRead,              // Mark single message as read
  markAllAsRead,           // Mark all messages as read
} from "@/api-client/notification";
```

## Gestures and Interactions

### Swipe Navigation
- **Swipe Left**: Next message
- **Swipe Right**: Previous message
- Threshold: 30% of screen width or velocity > 500px/s
- Visual feedback: Scale and opacity changes during swipe

### Buttons
- **Mark as read**: Marks current message as read and moves to next
- **Don't show again**: Permanently dismisses the message
- **Mark all as read**: Marks all messages as read and closes modal
- **Navigation arrows**: Tap to navigate (visible when multiple messages)

### Other
- **Close button**: Tap X to close modal
- **Backdrop**: Tap outside modal to close
- **Android back button**: Closes modal

## Theming

The component automatically adapts to your app's theme using `useTheme()`:

```tsx
const { colors } = useTheme();

// Uses:
// - colors.card (modal background)
// - colors.foreground (text)
// - colors.border (borders)
// - colors.primary (primary button)
// - colors.mutedForeground (secondary text)
```

## Performance

- Uses `react-native-reanimated` for 60fps animations
- Gestures run on UI thread (not JS thread)
- AsyncStorage operations are async
- Minimal re-renders with proper memoization

## Testing Checklist

- [ ] Modal shows on first mount with unread messages
- [ ] Can swipe between messages
- [ ] Mark as read removes message from list
- [ ] Don't show again persists across app restarts
- [ ] Mark all as read closes modal
- [ ] Close button works
- [ ] Backdrop press closes modal
- [ ] Android back button closes modal
- [ ] Safe areas respected (notch, home indicator)
- [ ] Animations are smooth
- [ ] Haptic feedback works
- [ ] Works in light and dark mode
- [ ] Works on different screen sizes

## Troubleshooting

### Modal doesn't show

**Problem**: Modal doesn't appear even with unread messages

**Solutions**:
1. Check that `userId` is being passed correctly
2. Verify `fetchMessages` is returning data (add `debug={true}`)
3. Check AsyncStorage to see if messages were previously dismissed
4. Ensure `autoShow={true}` is set

**Debug**:
```tsx
<MessageModalProvider userId={user?.id} debug={true} />
```

### Swipe gestures not working

**Problem**: Can't swipe between messages

**Solutions**:
1. Verify `react-native-gesture-handler` is installed
2. Check that `GestureHandlerRootView` is in your app root
3. Make sure no parent views have `pointerEvents="none"`

### Animations are choppy

**Problem**: Animations feel laggy or choppy

**Solutions**:
1. Test on a real device (simulators can be slow)
2. Verify `react-native-reanimated` is properly configured
3. Check that babel.config.js has the reanimated plugin:
```js
module.exports = {
  plugins: [
    'react-native-reanimated/plugin',
  ],
};
```

### Messages reappear after dismissing

**Problem**: Dismissed messages show up again

**Solutions**:
1. Check AsyncStorage permissions
2. Verify `dontShowAgain` is being called
3. Check console for AsyncStorage errors
4. Clear app data and test again

## Migration Notes

If you have an existing notification system:

1. The MessageModal uses the same `Notification` type from `/mobile/src/types/notification.ts`
2. It integrates with the existing API at `/mobile/src/api-client/notification.ts`
3. No database changes are needed
4. AsyncStorage is used for client-side persistence only

## Next Steps

1. Add the MessageModal to your root layout
2. Test with your auth system
3. Customize the message fetching logic if needed
4. Adjust styling if needed (respects your theme)
5. Set up server-side notification delivery

## Support

For issues or questions:
1. Check the component README at `/mobile/src/components/message/README.md`
2. Review examples at `/mobile/src/components/message/MessageModalIntegration.example.tsx`
3. Enable debug mode: `<MessageModalProvider debug={true} />`
4. Check console logs for errors

## Example Integration

Here's a complete example of integrating with an auth context:

```tsx
// src/app/_layout.tsx
import { useAuth } from "@/contexts/AuthContext";
import { MessageModalProvider } from "@/components/message";

export default function RootLayout() {
  const { user } = useAuth();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>

          {/* Add MessageModal */}
          {user && (
            <MessageModalProvider
              userId={user.id}
              autoShow={true}
              maxMessages={50}
            />
          )}
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
```

That's it! The MessageModal is now integrated into your app.
