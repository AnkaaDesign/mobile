/**
 * useNotifications Hook
 *
 * React hook for managing notifications in the app.
 * Provides easy access to notification functionality with proper lifecycle management.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  notificationService,
  notificationCategoriesService,
  notificationHandlerService,
  backgroundSyncService,
  soundVibrationService,
  updateBadgeCount,
} from '@/services/notifications';
import type { NotificationPermissions, DeviceToken } from '@/services/notifications/notificationService';

export interface UseNotificationsOptions {
  userId?: string;
  autoInitialize?: boolean;
  enableBackgroundSync?: boolean;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void;
}

export interface UseNotificationsResult {
  permissions: NotificationPermissions | null;
  deviceToken: DeviceToken | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  requestPermissions: () => Promise<void>;
  getDeviceToken: () => Promise<void>;
  updateBadge: (count: number) => Promise<void>;
  clearBadge: () => Promise<void>;
  triggerManualSync: () => Promise<void>;
}

/**
 * Hook for managing notifications in the app
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsResult {
  const {
    userId,
    autoInitialize = true,
    enableBackgroundSync = true,
    onNotificationReceived,
    onNotificationTapped,
  } = options;

  const [permissions, setPermissions] = useState<NotificationPermissions | null>(null);
  const [deviceToken, setDeviceToken] = useState<DeviceToken | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<Notifications.Subscription>(undefined);
  const responseListener = useRef<Notifications.Subscription>(undefined);

  /**
   * Initialize notification services
   */
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize core notification service
      await notificationService.initialize();

      // Initialize notification categories (iOS)
      await notificationCategoriesService.initialize();

      // Initialize sound and vibration
      await soundVibrationService.initialize();

      // Get initial permissions
      const perms = await notificationService.getPermissions();
      setPermissions(perms);

      // Get device token if permissions granted
      if (perms.granted) {
        const token = await notificationService.getDeviceToken();
        setDeviceToken(token);

        // Initialize background sync if enabled
        if (enableBackgroundSync && userId) {
          await backgroundSyncService.initialize(userId);
        }
      }

      setIsInitialized(true);
      console.log('[useNotifications] Initialized successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useNotifications] Initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, enableBackgroundSync]);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const perms = await notificationService.requestPermissions();
      setPermissions(perms);

      if (perms.granted) {
        // Get device token
        const token = await notificationService.getDeviceToken();
        setDeviceToken(token);

        // Initialize background sync if enabled
        if (enableBackgroundSync && userId) {
          await backgroundSyncService.initialize(userId);
        }
      }

      console.log('[useNotifications] Permissions requested:', perms);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useNotifications] Failed to request permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, enableBackgroundSync]);

  /**
   * Get device token
   */
  const getDeviceToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await notificationService.getDeviceToken();
      setDeviceToken(token);

      console.log('[useNotifications] Device token retrieved');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useNotifications] Failed to get device token:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update badge count
   */
  const updateBadge = useCallback(async (count: number) => {
    try {
      await updateBadgeCount(count);
    } catch (err) {
      console.error('[useNotifications] Failed to update badge:', err);
    }
  }, []);

  /**
   * Clear badge
   */
  const clearBadge = useCallback(async () => {
    try {
      await updateBadgeCount(0);
    } catch (err) {
      console.error('[useNotifications] Failed to clear badge:', err);
    }
  }, []);

  /**
   * Trigger manual sync
   */
  const triggerManualSync = useCallback(async () => {
    if (!userId) {
      console.warn('[useNotifications] Cannot sync without user ID');
      return;
    }

    try {
      setIsLoading(true);
      await backgroundSyncService.triggerManualSync(userId);
      console.log('[useNotifications] Manual sync completed');
    } catch (err) {
      console.error('[useNotifications] Manual sync failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Setup notification listeners
   */
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    // Register notification received listener
    notificationListener.current = notificationService.registerNotificationListener(
      (notification) => {
        notificationHandlerService.handleNotificationReceived(notification);

        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // Register notification response listener
    responseListener.current = notificationService.registerResponseListener(
      async (response) => {
        await notificationHandlerService.handleNotificationResponse(response);

        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      }
    );

    // Check for notification that opened the app
    notificationHandlerService.getLastNotificationResponse().then((response) => {
      if (response && onNotificationTapped) {
        onNotificationTapped(response);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isInitialized, onNotificationReceived, onNotificationTapped]);

  /**
   * Initialize on mount if autoInitialize is true
   */
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initialize();
    }
  }, [autoInitialize, isInitialized, initialize]);

  /**
   * Update background sync user ID when it changes
   */
  useEffect(() => {
    if (isInitialized && enableBackgroundSync && userId) {
      backgroundSyncService.setUserId(userId);
    }
  }, [userId, isInitialized, enableBackgroundSync]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return {
    permissions,
    deviceToken,
    isInitialized,
    isLoading,
    error,
    requestPermissions,
    getDeviceToken,
    updateBadge,
    clearBadge,
    triggerManualSync,
  };
}

/**
 * Hook for tracking unread notification count
 */
export function useUnreadNotificationCount(userId?: string, refreshInterval: number = 60000) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) {
      setCount(0);
      return;
    }

    try {
      setIsLoading(true);

      // Import dynamically to avoid circular dependencies
      const { getUnreadNotifications } = await import('@/api-client/notification');

      const response = await getUnreadNotifications(userId, {
        limit: 1,
      });

      const unreadCount = response.total || 0;
      setCount(unreadCount);

      // Update badge
      await updateBadgeCount(unreadCount);
    } catch (error) {
      console.error('[useUnreadNotificationCount] Failed to fetch count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch on mount and when userId changes
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Refresh periodically
  useEffect(() => {
    if (!userId || refreshInterval <= 0) {
      return;
    }

    const intervalId = setInterval(fetchUnreadCount, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [userId, refreshInterval, fetchUnreadCount]);

  return {
    count,
    isLoading,
    refresh: fetchUnreadCount,
  };
}
