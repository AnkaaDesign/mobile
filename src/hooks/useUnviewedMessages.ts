import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Notification } from "@/types";

// Storage key for daily dismissed messages
const DAILY_DISMISSED_KEY = "@ankaa/daily_dismissed_messages";

export interface UseUnviewedMessagesOptions {
  userId?: string;
  autoShow?: boolean;
  fetchMessages?: () => Promise<Notification[]>;
  /**
   * Interval in milliseconds to check for new messages
   * @default 60000 (1 minute)
   */
  checkInterval?: number;
  /**
   * Whether to refresh messages when app comes to foreground
   * @default true
   */
  refreshOnFocus?: boolean;
}

export interface UseUnviewedMessagesResult {
  messages: Notification[];
  unviewedMessages: Notification[];
  showModal: boolean;
  isLoading: boolean;
  error: Error | null;
  openModal: () => void;
  closeModal: () => void;
  /** Dismiss for today only - will show again tomorrow */
  dismissForToday: (messageId: string) => Promise<void>;
  /** Don't show again - permanent dismiss */
  dontShowAgain: (messageId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// Get today's date as YYYY-MM-DD
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Hook for managing unviewed messages and the message modal
 *
 * Features:
 * - Uses React Query for data fetching (same as web)
 * - Automatically refetches on app focus via focusManager
 * - Tracks which messages have been dismissed for today (AsyncStorage)
 * - Manages modal visibility state
 * - Auto-shows modal on first mount if there are unviewed messages
 * - Auto-shows modal when NEW messages arrive (count increases)
 * - Messages dismissed today will show again tomorrow (automatic cleanup)
 * - Periodic polling for new messages (default: 60 seconds)
 */
export function useUnviewedMessages(
  options: UseUnviewedMessagesOptions = {}
): UseUnviewedMessagesResult {
  const {
    userId,
    autoShow = true,
    fetchMessages,
    checkInterval = 60000, // 1 minute default (same as web)
    refreshOnFocus = true,
  } = options;

  // Track if we've shown the modal in this foreground session
  // Resets when app goes to background so modal can show again on next focus
  const hasShownThisSession = useRef<boolean>(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const [dailyDismissed, setDailyDismissed] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);

  // Load and cleanup daily dismissed messages from storage
  const loadDailyDismissed = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(DAILY_DISMISSED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        const today = getTodayDate();

        // Clean up old entries (keep only today's dismissals)
        const cleaned: Record<string, string> = {};
        for (const [messageId, date] of Object.entries(parsed)) {
          if (date === today) {
            cleaned[messageId] = date;
          }
        }

        setDailyDismissed(cleaned);

        // Save cleaned version back if different
        if (Object.keys(parsed).length !== Object.keys(cleaned).length) {
          await AsyncStorage.setItem(DAILY_DISMISSED_KEY, JSON.stringify(cleaned));
        }
      }
    } catch (err) {
      console.error("[useUnviewedMessages] Failed to load daily dismissed:", err);
    }
  }, []);

  // Save daily dismissed messages to storage
  const saveDailyDismissed = useCallback(async (dismissed: Record<string, string>) => {
    try {
      await AsyncStorage.setItem(DAILY_DISMISSED_KEY, JSON.stringify(dismissed));
    } catch (err) {
      console.error("[useUnviewedMessages] Failed to save daily dismissed:", err);
    }
  }, []);

  // Check if a message was dismissed today
  const isDismissedToday = useCallback((messageId: string): boolean => {
    const dismissedDate = dailyDismissed[messageId];
    if (!dismissedDate) return false;
    return dismissedDate === getTodayDate();
  }, [dailyDismissed]);

  // Use React Query for fetching messages (same pattern as web)
  const {
    data: messagesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["messages", "unviewed", userId],
    queryFn: async () => {
      if (!userId || !fetchMessages) {
        return [];
      }
      try {
        const messages = await fetchMessages();
        return messages;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        // Check if this is a 404 (endpoint doesn't exist)
        const errorMessage = error.message || "";
        if (errorMessage.includes("Cannot GET") || errorMessage.includes("404") || errorMessage.includes("Not Found")) {
          if (__DEV__) {
            console.warn("[useUnviewedMessages] Endpoint unavailable");
          }
        }
        throw error;
      }
    },
    enabled: !!userId && !!fetchMessages,
    refetchInterval: checkInterval, // Poll every 60 seconds (same as web)
    refetchOnWindowFocus: refreshOnFocus, // Works with AppState via focusManager
    refetchOnMount: 'always', // Always fetch on mount (same as web)
    staleTime: 0, // Always considered stale (same as web)
    gcTime: 0, // No garbage collection (same as web)
    retry: false, // Don't retry failed requests
  });

  const messages = Array.isArray(messagesData) ? messagesData : [];

  // Filter unviewed messages (exclude those dismissed today)
  const unviewedMessages = useMemo(() => {
    return messages.filter((msg) => !isDismissedToday(msg.id));
  }, [messages, isDismissedToday]);

  // Open modal
  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  // Close modal - also dismisses all currently shown messages for today
  // so they won't show again until tomorrow
  const closeModal = useCallback(async () => {
    setShowModal(false);

    // Dismiss all current unviewed messages for today so they don't show again on next focus
    if (unviewedMessages.length > 0) {
      const today = getTodayDate();
      const newDismissed = { ...dailyDismissed };

      for (const msg of unviewedMessages) {
        newDismissed[msg.id] = today;
      }

      setDailyDismissed(newDismissed);
      await saveDailyDismissed(newDismissed);
    }
  }, [unviewedMessages, dailyDismissed, saveDailyDismissed]);

  // Dismiss for today only (store locally, will show again tomorrow)
  const dismissForToday = useCallback(
    async (messageId: string) => {
      console.log("[useUnviewedMessages] Dismissing for today:", messageId);

      const newDismissed = {
        ...dailyDismissed,
        [messageId]: getTodayDate(),
      };

      setDailyDismissed(newDismissed);
      await saveDailyDismissed(newDismissed);
    },
    [dailyDismissed, saveDailyDismissed]
  );

  // Don't show again (this will be handled by the integration to call the API)
  const dontShowAgain = useCallback(
    async (messageId: string) => {
      console.log("[useUnviewedMessages] Don't show again (permanent):", messageId);

      // Also dismiss locally for immediate UI update
      const newDismissed = {
        ...dailyDismissed,
        [messageId]: getTodayDate(),
      };

      setDailyDismissed(newDismissed);
      await saveDailyDismissed(newDismissed);
    },
    [dailyDismissed, saveDailyDismissed]
  );

  // Refresh messages
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Load daily dismissed messages on mount
  useEffect(() => {
    loadDailyDismissed();
  }, [loadDailyDismissed]);

  // Reset session tracking when app goes to background
  // This allows modal to show again when user returns to the app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // App went to background - reset session tracking
      if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        hasShownThisSession.current = false;
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Auto-show modal when unviewed messages are available
  // Shows on every app focus if there are unviewed messages (not yet shown this session)
  useEffect(() => {
    if (!autoShow || isLoading) {
      return;
    }

    // Show modal if there are unviewed messages and we haven't shown it this session
    if (!hasShownThisSession.current && unviewedMessages.length > 0) {
      hasShownThisSession.current = true;
      setShowModal(true);
    }
  }, [autoShow, unviewedMessages.length, isLoading]);

  return {
    messages,
    unviewedMessages,
    showModal,
    isLoading,
    error: error as Error | null,
    openModal,
    closeModal,
    dismissForToday,
    dontShowAgain,
    refresh,
  };
}
