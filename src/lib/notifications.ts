import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,  // Show banner notification
    shouldShowList: true,    // Show in notification list
    shouldPlaySound: true,   // Play sound
    shouldSetBadge: true,    // Update badge
  }),
});

// Notification channel IDs for Android
export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'default',
  HIGH_PRIORITY: 'high-priority',
  LOW_PRIORITY: 'low-priority',
} as const;

/**
 * Register for push notifications and get Expo push token
 * @param projectId - The Expo project ID from app.json
 * @returns The Expo push token string, or null if registration failed
 */
export async function registerForPushNotifications(projectId: string): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Must use physical device for push notifications');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Permission denied
    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Setup Android notification channels
    if (Platform.OS === 'android') {
      await setupAndroidNotificationChannels();
    }

    return tokenData.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Setup Android notification channels with different priority levels
 */
async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // Default channel
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEFAULT, {
      name: 'Notificações Gerais',
      description: 'Notificações padrão do aplicativo',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#15803d',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // High priority channel for urgent notifications
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.HIGH_PRIORITY, {
      name: 'Urgentes',
      description: 'Notificações importantes e urgentes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#15803d',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // Low priority channel for optional notifications
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.LOW_PRIORITY, {
      name: 'Informações',
      description: 'Notificações informativas',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 100],
      lightColor: '#15803d',
      sound: undefined,
      enableVibrate: false,
      showBadge: false,
    });

    console.log('Android notification channels configured');
  } catch (error) {
    console.error('Error setting up Android notification channels:', error);
  }
}

/**
 * Setup notification event listeners
 * @param onNotificationReceived - Called when a notification is received while app is foregrounded
 * @param onNotificationClicked - Called when user taps on a notification
 * @returns Cleanup function to remove listeners
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationClicked: (response: Notifications.NotificationResponse) => void
): () => void {
  // Listen for notifications received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(onNotificationReceived);

  // Listen for notification interactions (user tapped notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(onNotificationClicked);

  // Return cleanup function - use .remove() method on subscription objects
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Handle notification tap - extract deep link and navigate
 * @param response - The notification response from user interaction
 * @returns The deep link URL if present, null otherwise
 */
export function handleNotificationTap(response: Notifications.NotificationResponse): string | null {
  try {
    const data = response.notification.request.content.data;

    // Extract deep link from notification data
    if (data?.url && typeof data.url === 'string') {
      return data.url;
    }

    // Try alternative data structures
    if (data?.deepLink && typeof data.deepLink === 'string') {
      return data.deepLink;
    }

    if (data?.link && typeof data.link === 'string') {
      return data.link;
    }

    // Generate deep link from entity type and ID if present
    if (data?.entityType && data?.entityId) {
      const { generateNotificationLink } = require('./deep-linking');
      return generateNotificationLink(data.entityType, data.entityId);
    }

    return null;
  } catch (error) {
    console.error('Error handling notification tap:', error);
    return null;
  }
}

/**
 * Get the last notification response (useful for handling cold starts)
 * @returns The last notification response if app was opened via notification
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch (error) {
    console.error('Error getting last notification response:', error);
    return null;
  }
}

/**
 * Clear all notifications from the notification tray
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Clear a specific notification from the notification tray
 * @param notificationId - The notification identifier
 */
export async function clearNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error clearing notification:', error);
  }
}

/**
 * Get the current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Set the app badge count (iOS/Android)
 * @param count - The badge count number
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Schedule a local notification
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data payload
 * @param trigger - When to trigger the notification (null for immediate)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput | null
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: trigger || null, // null means show immediately
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    return null;
  }
}
