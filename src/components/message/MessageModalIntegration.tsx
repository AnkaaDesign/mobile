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
import { apiClient } from "@/api-client/axiosClient";

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
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * MessageModal Provider Component
 *
 * Manages the message modal state and integrates with the message API
 */
export function MessageModalProvider({
  userId: providedUserId,
  autoShow = true,
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
    dismissForToday,
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
          console.log("[MessageModalProvider] Fetching unviewed messages for user:", userId);
        }

        // Call the /messages/unviewed endpoint
        const response = await apiClient.get("/messages/unviewed");
        const messages = response.data?.data || [];

        if (debug) {
          console.log("[MessageModalProvider] Fetched", messages.length, "unviewed messages");
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
      onDismissForToday={async (messageId) => {
        try {
          if (debug) {
            console.log("[MessageModalProvider] Dismissing for today:", messageId);
          }

          // Dismiss for today locally (stored in AsyncStorage)
          await dismissForToday(messageId);

          if (debug) {
            console.log("[MessageModalProvider] Successfully dismissed for today");
          }
        } catch (error) {
          console.error("[MessageModalProvider] Failed to dismiss for today:", error);
        }
      }}
      onDontShowAgain={async (messageId) => {
        try {
          if (debug) {
            console.log("[MessageModalProvider] Don't show again (permanent):", messageId);
          }

          // Dismiss locally first (for immediate UI update)
          await dontShowAgain(messageId);

          // Then mark as viewed on the server (permanent)
          await apiClient.post(`/messages/${messageId}/mark-viewed`);

          if (debug) {
            console.log("[MessageModalProvider] Successfully marked as permanently viewed");
          }
        } catch (error) {
          console.error("[MessageModalProvider] Failed to mark as viewed:", error);
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
