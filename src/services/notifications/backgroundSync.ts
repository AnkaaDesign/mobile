/**
 * Background Notification Sync Service
 *
 * Manages background fetch and notification synchronization.
 * Fetches new notifications periodically even when app is closed.
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { updateBadgeCount } from './localNotifications';
import { getUnreadNotifications } from '@/api-client/notification';

// Task names
export const BACKGROUND_NOTIFICATION_SYNC = 'background-notification-sync';
export const BACKGROUND_BADGE_UPDATE = 'background-badge-update';

export interface BackgroundSyncConfig {
  minimumInterval?: number; // in seconds
  stopOnTerminate?: boolean;
  startOnBoot?: boolean;
}

export const DEFAULT_SYNC_CONFIG: BackgroundSyncConfig = {
  minimumInterval: 15 * 60, // 15 minutes
  stopOnTerminate: false,
  startOnBoot: true,
};

/**
 * BackgroundSyncService class for managing background notification sync
 */
export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private config: BackgroundSyncConfig;
  private isRegistered: boolean = false;

  private constructor(config: BackgroundSyncConfig = DEFAULT_SYNC_CONFIG) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: BackgroundSyncConfig): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService(config);
    }
    return BackgroundSyncService.instance;
  }

  /**
   * Initialize background sync tasks
   */
  public async initialize(userId?: string): Promise<void> {
    try {
      // Define the background sync task
      this.defineNotificationSyncTask(userId);

      // Register the task
      await this.registerBackgroundSync();

      console.log('[BackgroundSync] Initialized successfully');
    } catch (error) {
      console.error('[BackgroundSync] Initialization failed:', error);
      throw new Error(`Failed to initialize background sync: ${error}`);
    }
  }

  /**
   * Define the notification sync task
   */
  private defineNotificationSyncTask(userId?: string): void {
    try {
      TaskManager.defineTask(BACKGROUND_NOTIFICATION_SYNC, async () => {
        try {
          console.log('[BackgroundSync] Running notification sync task');

          if (!userId) {
            console.warn('[BackgroundSync] No user ID provided, skipping sync');
            return BackgroundFetch.BackgroundFetchResult.NoData;
          }

          // Fetch new notifications
          const response = await getUnreadNotifications(userId, {
            limit: 100,
            orderBy: { createdAt: 'desc' },
          });

          const newNotifications = response.data || [];
          const unreadCount = newNotifications.length;

          console.log(`[BackgroundSync] Found ${unreadCount} unread notifications`);

          // Update badge count
          await updateBadgeCount(unreadCount);

          // You can also trigger local notifications for important updates here
          // await this.notifyImportantUpdates(newNotifications);

          return unreadCount > 0
            ? BackgroundFetch.BackgroundFetchResult.NewData
            : BackgroundFetch.BackgroundFetchResult.NoData;
        } catch (error) {
          console.error('[BackgroundSync] Task execution failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      console.log('[BackgroundSync] Task defined successfully');
    } catch (error) {
      console.error('[BackgroundSync] Failed to define task:', error);
      throw error;
    }
  }

  /**
   * Register background sync task
   */
  public async registerBackgroundSync(): Promise<void> {
    try {
      // Check if task is already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_NOTIFICATION_SYNC
      );

      if (isRegistered) {
        console.log('[BackgroundSync] Task already registered');
        this.isRegistered = true;
        return;
      }

      // Register the task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_SYNC, {
        minimumInterval: this.config.minimumInterval,
        stopOnTerminate: this.config.stopOnTerminate,
        startOnBoot: this.config.startOnBoot,
      });

      this.isRegistered = true;
      console.log('[BackgroundSync] Task registered successfully');
    } catch (error) {
      console.error('[BackgroundSync] Failed to register task:', error);
      throw new Error(`Failed to register background sync task: ${error}`);
    }
  }

  /**
   * Unregister background sync task
   */
  public async unregisterBackgroundSync(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_NOTIFICATION_SYNC
      );

      if (!isRegistered) {
        console.log('[BackgroundSync] Task not registered');
        return;
      }

      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_SYNC);

      this.isRegistered = false;
      console.log('[BackgroundSync] Task unregistered successfully');
    } catch (error) {
      console.error('[BackgroundSync] Failed to unregister task:', error);
      throw new Error(`Failed to unregister background sync task: ${error}`);
    }
  }

  /**
   * Check if background sync is registered
   */
  public async isBackgroundSyncRegistered(): Promise<boolean> {
    try {
      return await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_SYNC);
    } catch (error) {
      console.error('[BackgroundSync] Failed to check registration status:', error);
      return false;
    }
  }

  /**
   * Get background fetch status
   */
  public async getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
    try {
      return await BackgroundFetch.getStatusAsync();
    } catch (error) {
      console.error('[BackgroundSync] Failed to get status:', error);
      return BackgroundFetch.BackgroundFetchStatus.Denied;
    }
  }

  /**
   * Update sync configuration
   */
  public updateConfig(config: Partial<BackgroundSyncConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[BackgroundSync] Configuration updated');
  }

  /**
   * Get current configuration
   */
  public getConfig(): BackgroundSyncConfig {
    return { ...this.config };
  }

  /**
   * Manually trigger a background sync
   */
  public async triggerManualSync(userId: string): Promise<void> {
    try {
      console.log('[BackgroundSync] Triggering manual sync');

      // Fetch new notifications
      const response = await getUnreadNotifications(userId, {
        limit: 100,
        orderBy: { createdAt: 'desc' },
      });

      const newNotifications = response.data || [];
      const unreadCount = newNotifications.length;

      console.log(`[BackgroundSync] Manual sync found ${unreadCount} unread notifications`);

      // Update badge count
      await updateBadgeCount(unreadCount);

      console.log('[BackgroundSync] Manual sync completed');
    } catch (error) {
      console.error('[BackgroundSync] Manual sync failed:', error);
      throw new Error(`Manual sync failed: ${error}`);
    }
  }

  /**
   * Set the user ID for background sync
   */
  public setUserId(userId: string): void {
    // Redefine task with new user ID
    this.defineNotificationSyncTask(userId);
    console.log('[BackgroundSync] User ID updated');
  }
}

// Export singleton instance
export const backgroundSyncService = BackgroundSyncService.getInstance();

/**
 * Hook to initialize background sync
 */
export async function useBackgroundSync(
  userId?: string,
  config?: BackgroundSyncConfig
): Promise<BackgroundSyncService> {
  const service = BackgroundSyncService.getInstance(config);

  if (userId) {
    await service.initialize(userId);
  }

  return service;
}

/**
 * Check background fetch permissions and status
 */
export async function checkBackgroundFetchStatus(): Promise<{
  status: BackgroundFetch.BackgroundFetchStatus | null;
  isAvailable: boolean;
  message: string;
}> {
  try {
    const status = await BackgroundFetch.getStatusAsync();

    if (status === null) {
      return {
        status: null,
        isAvailable: false,
        message: 'Background fetch status unavailable',
      };
    }

    const statusMap: Record<number, { isAvailable: boolean; message: string }> = {
      [BackgroundFetch.BackgroundFetchStatus.Available]: {
        isAvailable: true,
        message: 'Background fetch is available',
      },
      [BackgroundFetch.BackgroundFetchStatus.Denied]: {
        isAvailable: false,
        message: 'Background fetch is denied',
      },
      [BackgroundFetch.BackgroundFetchStatus.Restricted]: {
        isAvailable: false,
        message: 'Background fetch is restricted',
      },
    };

    const result = statusMap[status] || {
      isAvailable: false,
      message: 'Unknown background fetch status',
    };

    return {
      status,
      ...result,
    };
  } catch (error) {
    console.error('[BackgroundSync] Failed to check status:', error);
    return {
      status: BackgroundFetch.BackgroundFetchStatus.Denied,
      isAvailable: false,
      message: `Failed to check status: ${error}`,
    };
  }
}
