import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Notification } from "@/types";

// Storage key for daily dismissed messages
const DAILY_DISMISSED_KEY = "@ankaa/daily_dismissed_messages";

export interface UseUnviewedMessagesOptions {
  userId?: string;
  autoShow?: boolean;
  fetchMessages?: () => Promise<Notification[]>;
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
 * - Fetches unviewed messages
 * - Tracks which messages have been dismissed for today (local storage)
 * - Manages modal visibility
 * - Auto-shows modal on first mount if there are unviewed messages
 * - Messages dismissed today will show again tomorrow
 */
export function useUnviewedMessages(
  options: UseUnviewedMessagesOptions = {}
): UseUnviewedMessagesResult {
  const { userId, autoShow = true, fetchMessages } = options;

  const [messages, setMessages] = useState<Notification[]>([]);
  const [dailyDismissed, setDailyDismissed] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasAutoShown, setHasAutoShown] = useState(false);

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

  // Fetch messages from API
  const loadMessages = useCallback(async () => {
    if (!fetchMessages || !userId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const fetchedMessages = await fetchMessages();
      setMessages(fetchedMessages);

      console.log("[useUnviewedMessages] Loaded", fetchedMessages.length, "messages from API");
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useUnviewedMessages] Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMessages, userId]);

  // Filter unviewed messages (exclude those dismissed today)
  const unviewedMessages = messages.filter(
    (msg) => !isDismissedToday(msg.id)
  );

  // Open modal
  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

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
    await loadMessages();
  }, [loadMessages]);

  // Load daily dismissed messages on mount
  useEffect(() => {
    loadDailyDismissed();
  }, [loadDailyDismissed]);

  // Load messages when userId changes
  useEffect(() => {
    if (userId) {
      loadMessages();
    }
  }, [userId, loadMessages]);

  // Auto-show modal if there are unviewed messages (only on first load)
  useEffect(() => {
    if (autoShow && !hasAutoShown && unviewedMessages.length > 0 && !isLoading) {
      setShowModal(true);
      setHasAutoShown(true);
    }
  }, [autoShow, hasAutoShown, unviewedMessages.length, isLoading]);

  return {
    messages,
    unviewedMessages,
    showModal,
    isLoading,
    error,
    openModal,
    closeModal,
    dismissForToday,
    dontShowAgain,
    refresh,
  };
}
