# MessageModal - Quick Start

## 1-Minute Integration

### Step 1: Add to Root Layout

```tsx
// src/app/_layout.tsx
import { MessageModalProvider } from "@/components/message";

export default function RootLayout() {
  const { user } = useAuth(); // Your auth hook

  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(tabs)" />
      </Stack>

      {/* Add this line */}
      <MessageModalProvider userId={user?.id} />
    </ThemeProvider>
  );
}
```

### Step 2: That's It!

The modal will automatically:
- Fetch unread notifications
- Show on first mount if messages exist
- Allow swiping between messages
- Save user preferences

## Common Patterns

### Pattern 1: Basic (Recommended)
```tsx
<MessageModalProvider userId={user?.id} />
```

### Pattern 2: With Debug Logging
```tsx
<MessageModalProvider userId={user?.id} debug={true} />
```

### Pattern 3: Disable Auto-Show
```tsx
<MessageModalProvider userId={user?.id} autoShow={false} />
```

### Pattern 4: Custom Max Messages
```tsx
<MessageModalProvider userId={user?.id} maxMessages={100} />
```

## Manual Control Example

```tsx
import { useUnviewedMessages } from "@/hooks/useUnviewedMessages";
import { MessageModal } from "@/components/message";
import { getUnreadNotifications } from "@/api-client/notification";

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
    autoShow: false,
    fetchMessages: async () => {
      const res = await getUnreadNotifications(user.id);
      return res.data || [];
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

## Features

- ✅ Auto-shows on mount if unread messages exist
- ✅ Swipe left/right to navigate
- ✅ Mark as read
- ✅ Don't show again
- ✅ Mark all as read
- ✅ Smooth animations
- ✅ Haptic feedback
- ✅ Safe area support
- ✅ Theme support
- ✅ AsyncStorage persistence

## Gestures

- **Swipe Left**: Next message
- **Swipe Right**: Previous message
- **Tap Close (X)**: Close modal
- **Tap Backdrop**: Close modal
- **Tap Arrows**: Navigate messages
- **Android Back**: Close modal

## Troubleshooting

**Modal doesn't show?**
```tsx
<MessageModalProvider userId={user?.id} debug={true} />
// Check console for logs
```

**Clear stored data?**
```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

// Clear dismissed messages
await AsyncStorage.removeItem("@ankaa/dismissed_messages");
await AsyncStorage.removeItem("@ankaa/viewed_messages");
```

## Props Reference

### MessageModalProvider
```tsx
interface Props {
  userId?: string;      // Required - user ID
  autoShow?: boolean;   // Default: true
  maxMessages?: number; // Default: 50
  debug?: boolean;      // Default: false
}
```

### useUnviewedMessages Hook
```tsx
const {
  messages,          // All fetched messages
  unviewedMessages,  // Filtered unviewed messages
  showModal,         // Boolean - show modal
  isLoading,         // Boolean - loading state
  error,             // Error | null
  openModal,         // () => void
  closeModal,        // () => void
  markAsRead,        // (id: string) => Promise<void>
  markAllAsRead,     // () => Promise<void>
  dontShowAgain,     // (id: string) => Promise<void>
  refresh,           // () => Promise<void>
} = useUnviewedMessages(options);
```

## Files

- **Component**: `/mobile/src/components/message/MessageModal.tsx`
- **Integration**: `/mobile/src/components/message/MessageModalIntegration.tsx`
- **Hook**: `/mobile/src/hooks/useUnviewedMessages.ts`
- **Examples**: `/mobile/src/components/message/MessageModalIntegration.example.tsx`
- **Full Docs**: `/mobile/src/components/message/README.md`
- **Guide**: `/mobile/IMPLEMENTATION_GUIDE.md`

## Need Help?

1. Check `/mobile/src/components/message/README.md`
2. Review examples in `MessageModalIntegration.example.tsx`
3. Enable debug mode: `debug={true}`
4. Check console logs

## Complete Example

```tsx
// Full working example with auth context
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

          {user && (
            <MessageModalProvider
              userId={user.id}
              autoShow={true}
              maxMessages={50}
              debug={false}
            />
          )}
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
```

Done! Your app now has a native-feeling message modal.
