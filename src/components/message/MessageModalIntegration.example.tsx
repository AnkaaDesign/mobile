/**
 * MessageModal Integration Examples
 *
 * This file demonstrates how to integrate the MessageModal component
 * into your React Native application.
 */

import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { MessageModal } from "./MessageModal";
import { useUnviewedMessages } from "@/hooks/useUnviewedMessages";
import { getUnreadNotifications, markAsRead, markAllAsRead } from "@/api-client/notification";
import type { Notification } from "@/types";

// =====================================================
// Example 1: Basic Integration with Auto-Show
// =====================================================
// The modal will automatically show on first mount if there are unviewed messages
export function BasicMessageModalExample() {
  const userId = "user-123"; // Replace with actual user ID

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
      // Fetch unread notifications from the API
      const response = await getUnreadNotifications(userId, {
        limit: 50,
        orderBy: { createdAt: "desc" },
      });

      return response.data || [];
    },
  });

  return (
    <View style={styles.container}>
      {/* Your app content */}

      <MessageModal
        visible={showModal}
        onClose={closeModal}
        messages={unviewedMessages}
        onMarkAsRead={async (messageId) => {
          // Mark message as read locally
          await markMessageAsRead(messageId);

          // Mark message as read on the server
          await markAsRead(messageId, userId);
        }}
        onMarkAllAsRead={async () => {
          // Mark all messages as read locally
          await markAllMessagesAsRead();

          // Mark all messages as read on the server
          await markAllAsRead(userId);
        }}
        onDontShowAgain={async (messageId) => {
          // Don't show this message again
          await dontShowAgain(messageId);
        }}
      />
    </View>
  );
}

// =====================================================
// Example 2: Manual Control with Button Trigger
// =====================================================
// The modal won't auto-show, you control when to display it
export function ManualMessageModalExample() {
  const userId = "user-123"; // Replace with actual user ID

  const {
    unviewedMessages,
    showModal,
    openModal,
    closeModal,
    markAsRead: markMessageAsRead,
    markAllAsRead: markAllMessagesAsRead,
    dontShowAgain,
    refresh,
  } = useUnviewedMessages({
    userId,
    autoShow: false, // Disable auto-show
    fetchMessages: async () => {
      const response = await getUnreadNotifications(userId);
      return response.data || [];
    },
  });

  return (
    <View style={styles.container}>
      {/* Button to manually open the modal */}
      <TouchableOpacity
        style={styles.button}
        onPress={openModal}
      >
        <ThemedText>
          View Messages {unviewedMessages.length > 0 && `(${unviewedMessages.length})`}
        </ThemedText>
      </TouchableOpacity>

      {/* Button to refresh messages */}
      <TouchableOpacity
        style={styles.button}
        onPress={refresh}
      >
        <ThemedText>Refresh Messages</ThemedText>
      </TouchableOpacity>

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
    </View>
  );
}

// =====================================================
// Example 3: Integration in App Layout (Recommended)
// =====================================================
// Place the MessageModal at the root level of your app
// so it's available throughout the entire application
export function AppLayoutWithMessageModal({ children }: { children: React.ReactNode }) {
  const userId = "user-123"; // Get from auth context

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
      const response = await getUnreadNotifications(userId, {
        limit: 50,
        orderBy: { sentAt: "desc" },
      });

      return response.data || [];
    },
  });

  return (
    <>
      {children}

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

// =====================================================
// Example 4: With Auth Context Integration
// =====================================================
// Integrate with your authentication system
import { useAuth } from "@/contexts/AuthContext"; // Adjust import path

export function AuthAwareMessageModal() {
  const { user } = useAuth(); // Get authenticated user
  const userId = user?.id;

  const {
    unviewedMessages,
    showModal,
    closeModal,
    markAsRead: markMessageAsRead,
    markAllAsRead: markAllMessagesAsRead,
    dontShowAgain,
    refresh,
  } = useUnviewedMessages({
    userId,
    autoShow: true,
    fetchMessages: async () => {
      if (!userId) return [];

      const response = await getUnreadNotifications(userId, {
        limit: 50,
        orderBy: { sentAt: "desc" },
      });

      return response.data || [];
    },
  });

  // Refresh messages when user changes
  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  // Don't render if user is not authenticated
  if (!userId) {
    return null;
  }

  return (
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
  );
}

// =====================================================
// Example 5: Custom Message Fetching
// =====================================================
// Fetch messages with custom filtering and sorting
export function CustomFetchMessageModal() {
  const userId = "user-123";

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
      // Custom fetch with specific filters
      const response = await getUnreadNotifications(userId, {
        limit: 100,
        orderBy: { importance: "desc", sentAt: "desc" },
        // Add any additional filters here
        // For example, filter by importance or type
      });

      // You can further filter or transform the data here
      const messages = response.data || [];

      // Sort by importance (if you have custom logic)
      return messages.sort((a, b) => {
        // Your custom sorting logic
        return 0;
      });
    },
  });

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  button: {
    padding: 12,
    backgroundColor: "#15803d",
    borderRadius: 8,
    marginBottom: 8,
  },
});

// =====================================================
// Usage in your main app file (_layout.tsx or App.tsx)
// =====================================================
/*
import { AuthAwareMessageModal } from "@/components/message/MessageModalIntegration.example";

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* Your app navigation and screens *\/}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      {/* Add the MessageModal at the root level *\/}
      <AuthAwareMessageModal />
    </View>
  );
}
*/
