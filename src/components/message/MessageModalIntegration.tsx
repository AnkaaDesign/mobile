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

import React, { useEffect, useCallback, useRef } from "react";
import { MessageModal } from "./MessageModal";
import { useUnviewedMessages } from "@/hooks/useUnviewedMessages";
import { useAuth } from "@/contexts/auth-context";
import { messageService } from "@/api-client/message";

interface MessageModalProviderProps {
  /**
   * User ID to fetch messages for
   * If not provided, will automatically get from auth context
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
 * Automatically detects user from auth context if userId not provided
 */
export function MessageModalProvider({
  userId: providedUserId,
  autoShow = true,
  debug = false,
}: MessageModalProviderProps = {}) {
  // Get user from auth context
  const { user } = useAuth();

  // Use provided userId or fall back to auth context
  const userId = providedUserId || user?.id;

  // Track if we've already logged the endpoint error (to avoid spam)
  const hasLoggedEndpointError = useRef(false);

  // Memoize fetchMessages to prevent infinite loops
  // This function reference stays stable unless userId or debug changes
  const fetchMessages = useCallback(async () => {
    if (!userId) {
      return [];
    }

    try {
      // Use messageService to fetch unviewed messages
      const messages = await messageService.getUnviewedMessages();

      if (debug && messages.length > 0) {
        console.log("[MessageModalProvider] Fetched", messages.length, "unviewed messages");
      }

      return messages;
    } catch (error: any) {
      // Only log once per session to avoid console spam
      const errorMessage = error?.message || "";
      const isEndpointMissing = errorMessage.includes("Cannot GET") || errorMessage.includes("404");

      if (!hasLoggedEndpointError.current && isEndpointMissing) {
        hasLoggedEndpointError.current = true;
        if (__DEV__) {
          console.warn("[MessageModalProvider] /messages/unviewed endpoint not available");
        }
      } else if (debug && !isEndpointMissing) {
        console.error("[MessageModalProvider] Failed to fetch messages:", error);
      }

      return [];
    }
  }, [userId, debug]);

  const {
    unviewedMessages,
    showModal,
    closeModal,
    dismissForToday,
    dontShowAgain,
    isLoading,
    error,
  } = useUnviewedMessages({
    userId,
    autoShow,
    fetchMessages,
  });

  // Log errors in debug mode
  useEffect(() => {
    if (debug && error) {
      console.error("[MessageModalProvider] Error:", error);
    }
  }, [debug, error]);

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

          // Permanently dismiss on the server (sets dismissedAt, message never shows again)
          await messageService.dismissMessage(messageId);

          if (debug) {
            console.log("[MessageModalProvider] Successfully dismissed permanently");
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
 * This component automatically gets the user ID from auth context.
 * Use this for simple integration - just add <AuthAwareMessageModal /> to your layout.
 */
export function AuthAwareMessageModal({ debug = false }: { debug?: boolean } = {}) {
  // MessageModalProvider now automatically uses auth context
  return <MessageModalProvider autoShow={true} debug={debug} />;
}

/**
 * Example integration in _layout.tsx:
 *
 * ```tsx
 * import { AuthAwareMessageModal } from "@/components/message/MessageModalIntegration";
 *
 * export default function RootLayout() {
 *   return (
 *     <AuthProvider>
 *       <ThemeProvider>
 *         <Stack>
 *           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
 *         </Stack>
 *         <AuthAwareMessageModal />
 *       </ThemeProvider>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
