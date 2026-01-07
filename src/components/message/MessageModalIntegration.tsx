/**
 * MessageModal Integration Component
 *
 * This is a ready-to-use component that integrates the MessageModal
 * with your app's authentication system.
 *
 * Simply import and add this to your root layout:
 *
 * import { MessageModalProvider } from "@/components/message/MessageModalIntegration";
 *
 * <MessageModalProvider />
 */

import React, { useEffect } from "react";
import { MessageModal } from "./MessageModal";
import { useUnviewedMessages } from "@/hooks/useUnviewedMessages";
import { getUnreadNotifications, markAsRead, markAllAsRead } from "@/api-client/notification";

interface MessageModalProviderProps {
  /**
   * User ID to fetch messages for
   * If not provided, will attempt to get from auth context
   */
  userId?: string;

  /**
   * Whether to auto-show the modal on first mount
   * @default true
   */
  autoShow?: boolean;

  /**
   * Maximum number of messages to fetch
   * @default 50
   */
  maxMessages?: number;

  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * MessageModal Provider Component
 *
 * Manages the message modal state and integrates with the notification API
 */
export function MessageModalProvider({
  userId: providedUserId,
  autoShow = true,
  maxMessages = 50,
  debug = false,
}: MessageModalProviderProps = {}) {
  // You can uncomment this if you have an auth context
  // const { user } = useAuth();
  // const userId = providedUserId || user?.id;

  // For now, use the provided userId
  const userId = providedUserId;

  const {
    unviewedMessages,
    showModal,
    closeModal,
    markAsRead: markMessageAsRead,
    markAllAsRead: markAllMessagesAsRead,
    dontShowAgain,
    refresh,
    isLoading,
    error,
  } = useUnviewedMessages({
    userId,
    autoShow,
    fetchMessages: async () => {
      if (!userId) {
        if (debug) {
          console.log("[MessageModalProvider] No user ID, skipping fetch");
        }
        return [];
      }

      try {
        if (debug) {
          console.log("[MessageModalProvider] Fetching unread notifications for user:", userId);
        }

        const response = await getUnreadNotifications(userId, {
          limit: maxMessages,
          orderBy: { sentAt: "desc" },
        });

        const messages = response.data || [];

        if (debug) {
          console.log("[MessageModalProvider] Fetched", messages.length, "unread messages");
        }

        return messages;
      } catch (error) {
        console.error("[MessageModalProvider] Failed to fetch messages:", error);
        return [];
      }
    },
  });

  // Log errors in debug mode
  useEffect(() => {
    if (debug && error) {
      console.error("[MessageModalProvider] Error:", error);
    }
  }, [debug, error]);

  // Refresh messages when user ID changes
  useEffect(() => {
    if (userId && debug) {
      console.log("[MessageModalProvider] User ID changed, refreshing messages");
      refresh();
    }
  }, [userId, debug, refresh]);

  // Don't render if no user ID
  if (!userId) {
    if (debug) {
      console.log("[MessageModalProvider] No user ID, not rendering modal");
    }
    return null;
  }

  // Don't render if no messages and not loading
  if (unviewedMessages.length === 0 && !isLoading && !showModal) {
    if (debug) {
      console.log("[MessageModalProvider] No unviewed messages, not rendering modal");
    }
    return null;
  }

  return (
    <MessageModal
      visible={showModal}
      onClose={closeModal}
      messages={unviewedMessages}
      onMarkAsRead={async (messageId) => {
        try {
          if (debug) {
            console.log("[MessageModalProvider] Marking message as read:", messageId);
          }

          // Mark as read locally first (for immediate UI update)
          await markMessageAsRead(messageId);

          // Then mark as read on the server
          await markAsRead(messageId, userId);

          if (debug) {
            console.log("[MessageModalProvider] Successfully marked message as read");
          }
        } catch (error) {
          console.error("[MessageModalProvider] Failed to mark message as read:", error);
          // The local state has already been updated, so the UI still reflects the change
        }
      }}
      onMarkAllAsRead={async () => {
        try {
          if (debug) {
            console.log("[MessageModalProvider] Marking all messages as read");
          }

          // Mark all as read locally first
          await markAllMessagesAsRead();

          // Then mark all as read on the server
          await markAllAsRead(userId);

          if (debug) {
            console.log("[MessageModalProvider] Successfully marked all messages as read");
          }
        } catch (error) {
          console.error("[MessageModalProvider] Failed to mark all messages as read:", error);
          // The local state has already been updated, so the UI still reflects the change
        }
      }}
      onDontShowAgain={async (messageId) => {
        try {
          if (debug) {
            console.log("[MessageModalProvider] Don't show again:", messageId);
          }

          // Dismiss the message locally (persisted to AsyncStorage)
          await dontShowAgain(messageId);

          // Optionally, you can also mark it as read on the server
          // to ensure it doesn't show up in the unread count
          await markAsRead(messageId, userId);

          if (debug) {
            console.log("[MessageModalProvider] Successfully dismissed message");
          }
        } catch (error) {
          console.error("[MessageModalProvider] Failed to dismiss message:", error);
          // The local state has already been updated, so the UI still reflects the change
        }
      }}
    />
  );
}

/**
 * Auth-Aware MessageModal Provider
 *
 * This component automatically gets the user ID from your auth context.
 * Uncomment and modify the useAuth() call to match your auth context.
 */
export function AuthAwareMessageModal() {
  // Uncomment and adjust to match your auth context:
  // const { user } = useAuth();

  // For now, return null since we don't have auth context
  // You'll need to implement this based on your auth system
  return null;

  // Once you have auth context, use:
  // return <MessageModalProvider userId={user?.id} autoShow={true} debug={false} />;
}

/**
 * Example integration in _layout.tsx:
 *
 * ```tsx
 * import { MessageModalProvider } from "@/components/message/MessageModalIntegration";
 *
 * export default function RootLayout() {
 *   const { user } = useAuth(); // Get from your auth context
 *
 *   return (
 *     <ThemeProvider>
 *       <Stack>
 *         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
 *       </Stack>
 *
 *       {/* Add the MessageModal */}
 *       <MessageModalProvider userId={user?.id} />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
