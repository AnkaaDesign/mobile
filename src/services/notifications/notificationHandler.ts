/**
 * Notification Handler Service
 *
 * Handles notification responses and deep linking.
 * Processes user interactions with notifications and routes to appropriate screens.
 */

import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { NOTIFICATION_ACTIONS } from './notificationCategories';
import { scheduleReminder } from './localNotifications';
import { handleDeepLink as handleDeepLinkNavigation, generateNotificationLink } from '@/lib/deep-linking';

export interface NotificationData {
  url?: string;
  screen?: string;
  params?: Record<string, any>;
  entityType?: string;
  entityId?: string;
  notificationId?: string;
}

export interface NotificationResponse extends Notifications.NotificationResponse {
  notification: Notifications.Notification & {
    request: {
      content: {
        data: NotificationData;
      };
    };
  };
}

export type NotificationActionHandler = (
  data: NotificationData,
  notification: Notifications.Notification
) => void | Promise<void>;

/**
 * NotificationHandlerService class for processing notification interactions
 */
export class NotificationHandlerService {
  private static instance: NotificationHandlerService;
  private actionHandlers: Map<string, NotificationActionHandler> = new Map();
  private defaultHandler?: NotificationActionHandler;

  private constructor() {
    this.setupDefaultHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): NotificationHandlerService {
    if (!NotificationHandlerService.instance) {
      NotificationHandlerService.instance = new NotificationHandlerService();
    }
    return NotificationHandlerService.instance;
  }

  /**
   * Set up default action handlers
   */
  private setupDefaultHandlers(): void {
    // View action - navigate to detail screen
    this.registerActionHandler(NOTIFICATION_ACTIONS.VIEW, async (data) => {
      await this.handleDeepLink(data);
    });

    // Remind later action - schedule reminder
    this.registerActionHandler(NOTIFICATION_ACTIONS.REMIND_LATER, async (data, notification) => {
      try {
        const reminderTime = new Date();
        reminderTime.setHours(reminderTime.getHours() + 1); // Remind in 1 hour

        await scheduleReminder(
          notification.request.identifier,
          {
            title: notification.request.content.title || 'Reminder',
            body: notification.request.content.body || '',
            data: notification.request.content.data,
          },
          reminderTime
        );

        console.log('[NotificationHandler] Reminder scheduled successfully');
      } catch (error) {
        console.error('[NotificationHandler] Failed to schedule reminder:', error);
      }
    });

    // Mark as read action
    this.registerActionHandler(NOTIFICATION_ACTIONS.MARK_READ, async (data) => {
      try {
        if (data.notificationId) {
          // Call API to mark notification as read
          console.log(`[NotificationHandler] Marking notification as read: ${data.notificationId}`);
          // await markAsRead(data.notificationId, userId);
        }
      } catch (error) {
        console.error('[NotificationHandler] Failed to mark as read:', error);
      }
    });

    // Dismiss action - just dismiss
    this.registerActionHandler(NOTIFICATION_ACTIONS.DISMISS, async () => {
      console.log('[NotificationHandler] Notification dismissed');
    });
  }

  /**
   * Handle notification response
   */
  public async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    try {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data as NotificationData;

      console.log('[NotificationHandler] Processing notification response:', {
        action: actionIdentifier,
        data,
      });

      // Get handler for the specific action
      const handler = this.actionHandlers.get(actionIdentifier);

      if (handler) {
        await handler(data, notification);
      } else if (this.defaultHandler) {
        // Use default handler if no specific handler found
        await this.defaultHandler(data, notification);
      } else {
        // Default behavior - navigate to content
        await this.handleDeepLink(data);
      }
    } catch (error) {
      console.error('[NotificationHandler] Error handling notification response:', error);
      throw new Error(`Failed to handle notification response: ${error}`);
    }
  }

  /**
   * Handle deep linking from notification data
   */
  private async handleDeepLink(data: NotificationData): Promise<void> {
    try {
      console.log('[NotificationHandler] Processing deep link data:', data);

      // Priority 1: Use url if provided (direct deep link)
      if (data.url) {
        console.log('[NotificationHandler] Using direct URL:', data.url);
        // Use our centralized deep link handler with auth check
        await handleDeepLinkNavigation(data.url, true);
        return;
      }

      // Priority 2: Use entityType and entityId to generate deep link
      if (data.entityType && data.entityId) {
        const deepLink = generateNotificationLink(data.entityType as any, data.entityId);
        console.log('[NotificationHandler] Generated deep link from entity:', deepLink);
        await handleDeepLinkNavigation(deepLink, true);
        return;
      }

      // Priority 3: Use screen and params (legacy support)
      if (data.screen) {
        console.log('[NotificationHandler] Using screen navigation:', data.screen, data.params);
        // Try to convert screen path to deep link format
        const screenPath = data.screen.replace(/^\//, '');
        const deepLink = `ankaadesign://${screenPath}`;
        await handleDeepLinkNavigation(deepLink, true);
        return;
      }

      console.warn('[NotificationHandler] No navigation data in notification');
    } catch (error) {
      console.error('[NotificationHandler] Failed to handle deep link:', error);
      throw error;
    }
  }

  /**
   * Register a custom action handler
   */
  public registerActionHandler(
    actionIdentifier: string,
    handler: NotificationActionHandler
  ): void {
    this.actionHandlers.set(actionIdentifier, handler);
    console.log(`[NotificationHandler] Registered handler for action: ${actionIdentifier}`);
  }

  /**
   * Unregister an action handler
   */
  public unregisterActionHandler(actionIdentifier: string): void {
    this.actionHandlers.delete(actionIdentifier);
    console.log(`[NotificationHandler] Unregistered handler for action: ${actionIdentifier}`);
  }

  /**
   * Set default handler for unhandled actions
   */
  public setDefaultHandler(handler: NotificationActionHandler): void {
    this.defaultHandler = handler;
    console.log('[NotificationHandler] Default handler set');
  }

  /**
   * Clear default handler
   */
  public clearDefaultHandler(): void {
    this.defaultHandler = undefined;
    console.log('[NotificationHandler] Default handler cleared');
  }

  /**
   * Get last notification response (useful for handling app launch from notification)
   */
  public async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      console.error('[NotificationHandler] Failed to get last notification response:', error);
      return null;
    }
  }

  /**
   * Handle notification received while app is in foreground
   */
  public handleNotificationReceived(notification: Notifications.Notification): void {
    try {
      const data = notification.request.content.data as NotificationData;

      console.log('[NotificationHandler] Notification received in foreground:', {
        title: notification.request.content.title,
        data,
      });

      // You can add custom logic here, such as:
      // - Show in-app notification
      // - Update badge count
      // - Refresh data
    } catch (error) {
      console.error('[NotificationHandler] Error handling received notification:', error);
    }
  }

  /**
   * Build notification data for deep linking
   */
  public static buildNotificationData(
    screen: string,
    params?: Record<string, any>,
    additionalData?: Partial<NotificationData>
  ): NotificationData {
    return {
      screen,
      params,
      ...additionalData,
    };
  }

  /**
   * Build deep link URL
   */
  public static buildDeepLink(path: string, params?: Record<string, any>): string {
    const url = Linking.createURL(path);

    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');

      return `${url}?${queryString}`;
    }

    return url;
  }
}

// Export singleton instance
export const notificationHandlerService = NotificationHandlerService.getInstance();

/**
 * Hook to handle notification responses
 */
export function useNotificationResponseHandler(
  handler?: NotificationActionHandler
): Notifications.Subscription | null {
  try {
    const handlerService = NotificationHandlerService.getInstance();

    if (handler) {
      handlerService.setDefaultHandler(handler);
    }

    return Notifications.addNotificationResponseReceivedListener((response) => {
      handlerService.handleNotificationResponse(response);
    });
  } catch (error) {
    console.error('[NotificationHandler] Failed to setup response handler:', error);
    return null;
  }
}

/**
 * Hook to handle notifications received in foreground
 */
export function useNotificationReceivedHandler(
  handler?: (notification: Notifications.Notification) => void
): Notifications.Subscription | null {
  try {
    const handlerService = NotificationHandlerService.getInstance();

    return Notifications.addNotificationReceivedListener((notification) => {
      handlerService.handleNotificationReceived(notification);

      if (handler) {
        handler(notification);
      }
    });
  } catch (error) {
    console.error('[NotificationHandler] Failed to setup received handler:', error);
    return null;
  }
}
