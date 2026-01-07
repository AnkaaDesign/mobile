import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Notification } from "@/types";

const STORAGE_KEY = "@ankaa/dismissed_messages";
const VIEWED_MESSAGES_KEY = "@ankaa/viewed_messages";

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
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dontShowAgain: (messageId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing unviewed messages and the message modal
 *
 * Features:
 * - Fetches unviewed messages
 * - Tracks which messages have been dismissed
 * - Manages modal visibility
 * - Auto-shows modal on first mount if there are unviewed messages
 * - Persists dismissed messages across app sessions
 */
export function useUnviewedMessages(
  options: UseUnviewedMessagesOptions = {}
): UseUnviewedMessagesResult {
  const { userId, autoShow = true, fetchMessages } = options;

  const [messages, setMessages] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasAutoShown, setHasAutoShown] = useState(false);

  // Load dismissed messages from storage
  const loadDismissedMessages = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const dismissed = JSON.parse(stored);
        setDismissedIds(new Set(dismissed));
      }
    } catch (err) {
      console.error("[useUnviewedMessages] Failed to load dismissed messages:", err);
    }
  }, []);

  // Load viewed messages from storage
  const loadViewedMessages = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(VIEWED_MESSAGES_KEY);
      if (stored) {
        const viewed = JSON.parse(stored);
        setViewedIds(new Set(viewed));
      }
    } catch (err) {
      console.error("[useUnviewedMessages] Failed to load viewed messages:", err);
    }
  }, []);

  // Save dismissed messages to storage
  const saveDismissedMessages = useCallback(async (ids: Set<string>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch (err) {
      console.error("[useUnviewedMessages] Failed to save dismissed messages:", err);
    }
  }, []);

  // Save viewed messages to storage
  const saveViewedMessages = useCallback(async (ids: Set<string>) => {
    try {
      await AsyncStorage.setItem(VIEWED_MESSAGES_KEY, JSON.stringify(Array.from(ids)));
    } catch (err) {
      console.error("[useUnviewedMessages] Failed to save viewed messages:", err);
    }
  }, []);

  // Fetch messages
  const loadMessages = useCallback(async () => {
    if (!fetchMessages || !userId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const fetchedMessages = await fetchMessages();
      setMessages(fetchedMessages);

      console.log("[useUnviewedMessages] Loaded", fetchedMessages.length, "messages");
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useUnviewedMessages] Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMessages, userId]);

  // Filter unviewed messages (not dismissed and not marked as read)
  const unviewedMessages = messages.filter(
    (msg) => !dismissedIds.has(msg.id) && !viewedIds.has(msg.id)
  );

  // Open modal
  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // Mark a message as read
  const markAsRead = useCallback(
    async (messageId: string) => {
      const newViewedIds = new Set(viewedIds).add(messageId);
      setViewedIds(newViewedIds);
      await saveViewedMessages(newViewedIds);

      console.log("[useUnviewedMessages] Marked message as read:", messageId);
    },
    [viewedIds, saveViewedMessages]
  );

  // Mark all messages as read
  const markAllAsRead = useCallback(async () => {
    const allMessageIds = messages.map((msg) => msg.id);
    const newViewedIds = new Set([...viewedIds, ...allMessageIds]);
    setViewedIds(newViewedIds);
    await saveViewedMessages(newViewedIds);

    console.log("[useUnviewedMessages] Marked all messages as read");
  }, [messages, viewedIds, saveViewedMessages]);

  // Don't show a message again
  const dontShowAgain = useCallback(
    async (messageId: string) => {
      const newDismissedIds = new Set(dismissedIds).add(messageId);
      setDismissedIds(newDismissedIds);
      await saveDismissedMessages(newDismissedIds);

      console.log("[useUnviewedMessages] Don't show again:", messageId);
    },
    [dismissedIds, saveDismissedMessages]
  );

  // Refresh messages
  const refresh = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  // Load dismissed and viewed messages on mount
  useEffect(() => {
    loadDismissedMessages();
    loadViewedMessages();
  }, [loadDismissedMessages, loadViewedMessages]);

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
    markAsRead,
    markAllAsRead,
    dontShowAgain,
    refresh,
  };
}
