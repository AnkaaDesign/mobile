# MessageModal Component

A native-feeling modal component for displaying unviewed messages in the mobile application.

## Features

- **Auto-shows on first focus/mount** - Automatically displays when there are unviewed messages
- **Native-feeling modal design** - Smooth animations and gestures that feel like native mobile apps
- **One message at a time** - Clean, focused view of individual messages
- **Swipe navigation** - Swipe left/right to navigate between messages
- **Mark as read** - Easily mark messages as read with a button
- **Don't show again** - Option to permanently dismiss specific messages
- **Smooth animations** - Uses Reanimated for performant, native-quality animations
- **Safe area handling** - Properly handles notches, home indicators, and status bars
- **Gesture detection** - Uses react-native-gesture-handler for responsive swipe gestures

## Installation

The component uses the following dependencies (already in your project):

```bash
# Core dependencies
react-native-reanimated
react-native-gesture-handler
react-native-safe-area-context
expo-haptics

# UI components
@tabler/icons-react-native
@react-native-async-storage/async-storage
```

## Quick Start

### 1. Basic Usage

```tsx
import { MessageModal } from "@/components/message";
import { useUnviewedMessages } from "@/hooks/useUnviewedMessages";
import { getUnreadNotifications, markAsRead, markAllAsRead } from "@/api-client/notification";

function App() {
  const userId = "user-123"; // From your auth context

  const {
    unviewedMessages,
    showModal,
    closeModal,
    markAsRead: markMessageAsRead,
    markAllAsRead: markAllMessagesAsRead,
    dontShowAgain,
  } = useUnviewedMessages({
    userId,
    autoShow: true,
    fetchMessages: async () => {
      const response = await getUnreadNotifications(userId);
      return response.data || [];
    },
  });

  return (
    <>
      {/* Your app content */}

      <MessageModal
        visible={showModal}
        onClose={closeModal}
        messages={unviewedMessages}
        onMarkAsRead={async (messageId) => {
          await markMessageAsRead(messageId);
          await markAsRead(messageId, userId);
        }}
        onMarkAllAsRead={async () => {
          await markAllMessagesAsRead();
          await markAllAsRead(userId);
        }}
        onDontShowAgain={dontShowAgain}
      />
    </>
  );
}
```

### 2. Integration in App Layout

The recommended approach is to add the MessageModal at your root layout level:

```tsx
// src/app/_layout.tsx
import { AuthAwareMessageModal } from "@/components/message/MessageModalIntegration";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      {/* Add the MessageModal at the root level */}
      <AuthAwareMessageModal />
    </ThemeProvider>
  );
}
```

## Component Props

### MessageModal

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Called when the modal should close |
| `messages` | `Notification[]` | Yes | Array of messages to display |
| `onMarkAsRead` | `(messageId: string) => void` | No | Called when a message is marked as read |
| `onDontShowAgain` | `(messageId: string) => void` | No | Called when user chooses not to see a message again |
| `onMarkAllAsRead` | `() => void` | No | Called when user marks all messages as read |

## Hook API

### useUnviewedMessages

```tsx
const {
  messages,              // All fetched messages
  unviewedMessages,      // Messages that haven't been dismissed or marked as read
  showModal,            // Boolean - whether modal should be shown
  isLoading,            // Boolean - loading state
  error,                // Error | null - any error that occurred
  openModal,            // () => void - manually open the modal
  closeModal,           // () => void - manually close the modal
  markAsRead,           // (id: string) => Promise<void> - mark message as read
  markAllAsRead,        // () => Promise<void> - mark all as read
  dontShowAgain,        // (id: string) => Promise<void> - permanently dismiss
  refresh,              // () => Promise<void> - refresh messages
} = useUnviewedMessages(options);
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `userId` | `string` | `undefined` | User ID to fetch messages for |
| `autoShow` | `boolean` | `true` | Auto-show modal on first mount if messages exist |
| `fetchMessages` | `() => Promise<Notification[]>` | `undefined` | Function to fetch messages |

## Gestures and Interactions

### Swipe Navigation
- **Swipe Left**: Navigate to next message
- **Swipe Right**: Navigate to previous message
- Threshold: 30% of screen width or velocity > 500

### Visual Feedback
- Haptic feedback on navigation
- Scale and opacity animations during swipe
- Smooth spring animations

### Safe Areas
- Automatically respects notch areas
- Adjusts for home indicator on iOS
- Status bar aware

## Data Persistence

The hook automatically persists data using AsyncStorage:

- **Dismissed Messages**: Stored at `@ankaa/dismissed_messages`
- **Viewed Messages**: Stored at `@ankaa/viewed_messages`

This ensures that:
- Messages marked as "don't show again" stay dismissed across app restarts
- Read messages don't reappear
- User preferences are maintained

## Customization

### Theming

The component uses your app's theme from `useTheme()`:

```tsx
import { useTheme } from "@/lib/theme";

// The component automatically adapts to:
// - colors.card (modal background)
// - colors.foreground (text)
// - colors.border (borders)
// - colors.primary (buttons)
// - colors.mutedForeground (secondary text)
```

### Animations

Customize animation timing in the component:

```tsx
import { transitions } from "@/constants/design-system";

// Current values:
// - Modal fade: transitions.normal (300ms)
// - Swipe gesture: Spring with damping: 20, stiffness: 150
// - Scale/opacity: Interpolated based on swipe distance
```

## Performance Considerations

- Uses `react-native-reanimated` for 60fps animations
- Gesture handling runs on UI thread
- Minimal re-renders with proper memoization
- AsyncStorage operations are async and non-blocking

## Accessibility

- Proper safe area handling
- Android back button support
- Backdrop press to close
- Clear visual indicators
- Haptic feedback for actions

## Examples

See `MessageModalIntegration.example.tsx` for:
- Basic integration
- Manual control
- App layout integration
- Auth context integration
- Custom message fetching

## Troubleshooting

### Messages not appearing
- Check that `userId` is provided
- Verify `fetchMessages` is returning data
- Check console for errors
- Ensure messages haven't been dismissed previously

### Gestures not working
- Verify `react-native-gesture-handler` is properly installed
- Check that GestureHandlerRootView is in your app root
- Ensure no conflicting gesture handlers

### Animations choppy
- Check that `react-native-reanimated` is properly configured
- Verify babel.config.js includes the reanimated plugin
- Test on a physical device (simulators can be slower)

## File Structure

```
mobile/src/components/message/
├── MessageModal.tsx                    # Main modal component
├── MessageModalIntegration.tsx         # Ready-to-use integration
├── MessageModalIntegration.example.tsx # Usage examples
├── README.md                           # This file
└── index.ts                            # Exports

mobile/src/hooks/
└── useUnviewedMessages.ts             # Hook for message management
```

## Contributing

When modifying the component:
1. Test on both iOS and Android
2. Test with different screen sizes
3. Verify safe area handling
4. Check animations are smooth
5. Ensure accessibility features work

## License

Part of the Ankaa mobile application.
