/**
 * Core Notification Service
 *
 * Provides centralized notification management for the mobile app.
 * Handles permission requests, device token registration, and notification configuration.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface NotificationPermissions {
  status: Notifications.PermissionStatus;
  canAskAgain: boolean;
  granted: boolean;
}

export interface DeviceToken {
  token: string;
  type: 'expo' | 'apns' | 'fcm';
}

export interface NotificationServiceConfig {
  enableBadges?: boolean;
  enableSounds?: boolean;
  enableVibration?: boolean;
  allowInForeground?: boolean;
}

/**
 * Default notification handler configuration
 */
export const DEFAULT_NOTIFICATION_CONFIG: NotificationServiceConfig = {
  enableBadges: true,
  enableSounds: true,
  enableVibration: true,
  allowInForeground: true,
};

/**
 * NotificationService class for managing all notification-related functionality
 */
export class NotificationService {
  private static instance: NotificationService;
  private config: NotificationServiceConfig;
  private notificationListener?: Notifications.Subscription;
  private responseListener?: Notifications.Subscription;

  private constructor(config: NotificationServiceConfig = DEFAULT_NOTIFICATION_CONFIG) {
    this.config = { ...DEFAULT_NOTIFICATION_CONFIG, ...config };
  }

  /**
   * Get singleton instance of NotificationService
   */
  public static getInstance(config?: NotificationServiceConfig): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService(config);
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service with default handlers
   */
  public async initialize(): Promise<void> {
    try {
      // Set default notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: this.config.allowInForeground ?? true,
          shouldShowList: this.config.allowInForeground ?? true,
          shouldPlaySound: this.config.enableSounds ?? true,
          shouldSetBadge: this.config.enableBadges ?? true,
        }),
      });

      // Request permissions
      await this.requestPermissions();

      console.log('[NotificationService] Initialized successfully');
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
      throw new Error(`Failed to initialize notification service: ${error}`);
    }
  }

  /**
   * Request notification permissions from the user
   */
  public async requestPermissions(): Promise<NotificationPermissions> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      // Only ask if permissions have not already been determined
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const canAskAgain = finalStatus !== 'denied';
      const granted = finalStatus === 'granted';

      if (!granted) {
        console.warn('[NotificationService] Notification permissions not granted');
      }

      return {
        status: finalStatus,
        canAskAgain,
        granted,
      };
    } catch (error) {
      console.error('[NotificationService] Failed to request permissions:', error);
      throw new Error(`Failed to request notification permissions: ${error}`);
    }
  }

  /**
   * Get current notification permissions status
   */
  public async getPermissions(): Promise<NotificationPermissions> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();

      return {
        status,
        canAskAgain,
        granted: status === 'granted',
      };
    } catch (error) {
      console.error('[NotificationService] Failed to get permissions:', error);
      throw new Error(`Failed to get notification permissions: ${error}`);
    }
  }

  /**
   * Get device push notification token
   */
  public async getDeviceToken(): Promise<DeviceToken | null> {
    try {
      const permissions = await this.getPermissions();

      if (!permissions.granted) {
        console.warn('[NotificationService] Cannot get device token without permissions');
        return null;
      }

      // Ensure we're running on a physical device
      if (!Constants.isDevice) {
        console.warn('[NotificationService] Push notifications only work on physical devices');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      return {
        token: tokenData.data,
        type: 'expo',
      };
    } catch (error) {
      console.error('[NotificationService] Failed to get device token:', error);
      throw new Error(`Failed to get device push token: ${error}`);
    }
  }

  /**
   * Get native device token (APNS for iOS, FCM for Android)
   */
  public async getNativeDeviceToken(): Promise<DeviceToken | null> {
    try {
      const permissions = await this.getPermissions();

      if (!permissions.granted) {
        console.warn('[NotificationService] Cannot get native device token without permissions');
        return null;
      }

      if (!Constants.isDevice) {
        console.warn('[NotificationService] Push notifications only work on physical devices');
        return null;
      }

      const tokenData = await Notifications.getDevicePushTokenAsync();

      return {
        token: typeof tokenData.data === 'string' ? tokenData.data : JSON.stringify(tokenData.data),
        type: Platform.OS === 'ios' ? 'apns' : 'fcm',
      };
    } catch (error) {
      console.error('[NotificationService] Failed to get native device token:', error);
      return null;
    }
  }

  /**
   * Register notification received listener
   */
  public registerNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    try {
      // Remove existing listener if present
      if (this.notificationListener) {
        this.notificationListener.remove();
      }

      this.notificationListener = Notifications.addNotificationReceivedListener(callback);
      return this.notificationListener;
    } catch (error) {
      console.error('[NotificationService] Failed to register notification listener:', error);
      throw new Error(`Failed to register notification listener: ${error}`);
    }
  }

  /**
   * Register notification response listener (when user taps notification)
   */
  public registerResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    try {
      // Remove existing listener if present
      if (this.responseListener) {
        this.responseListener.remove();
      }

      this.responseListener = Notifications.addNotificationResponseReceivedListener(callback);
      return this.responseListener;
    } catch (error) {
      console.error('[NotificationService] Failed to register response listener:', error);
      throw new Error(`Failed to register notification response listener: ${error}`);
    }
  }

  /**
   * Update notification configuration
   */
  public updateConfig(config: Partial<NotificationServiceConfig>): void {
    this.config = { ...this.config, ...config };

    // Update notification handler with new config
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: this.config.allowInForeground ?? true,
        shouldShowList: this.config.allowInForeground ?? true,
        shouldPlaySound: this.config.enableSounds ?? true,
        shouldSetBadge: this.config.enableBadges ?? true,
      }),
    });
  }

  /**
   * Get current configuration
   */
  public getConfig(): NotificationServiceConfig {
    return { ...this.config };
  }

  /**
   * Clean up listeners
   */
  public cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = undefined;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = undefined;
    }

    console.log('[NotificationService] Cleaned up listeners');
  }

  /**
   * Dismiss all notifications
   */
  public async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('[NotificationService] Dismissed all notifications');
    } catch (error) {
      console.error('[NotificationService] Failed to dismiss notifications:', error);
      throw new Error(`Failed to dismiss all notifications: ${error}`);
    }
  }

  /**
   * Dismiss a specific notification
   */
  public async dismissNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
      console.log(`[NotificationService] Dismissed notification: ${notificationId}`);
    } catch (error) {
      console.error('[NotificationService] Failed to dismiss notification:', error);
      throw new Error(`Failed to dismiss notification ${notificationId}: ${error}`);
    }
  }

  /**
   * Get all presented notifications
   */
  public async getPresentedNotifications(): Promise<Notifications.Notification[]> {
    try {
      return await Notifications.getPresentedNotificationsAsync();
    } catch (error) {
      console.error('[NotificationService] Failed to get presented notifications:', error);
      throw new Error(`Failed to get presented notifications: ${error}`);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
