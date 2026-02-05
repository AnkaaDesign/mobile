/**
 * Local Notifications Service
 *
 * Manages local notification scheduling and badge count updates.
 * Handles reminders, scheduled notifications, and app badge management.
 */

import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATION_CATEGORIES } from './notificationCategories';
import type { NotificationData } from './notificationHandler';

export interface ScheduledNotificationContent {
  title: string;
  body: string;
  data?: NotificationData;
  subtitle?: string;
  sound?: boolean;
  badge?: number;
  categoryIdentifier?: string;
}

export interface LocalNotificationTrigger {
  date?: Date;
  seconds?: number;
  repeats?: boolean;
  channelId?: string;
}

/**
 * Update app badge count
 */
export async function updateBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
    console.log(`[LocalNotifications] Badge count updated to ${count}`);
  } catch (error) {
    console.error('[LocalNotifications] Failed to update badge count:', error);
    throw new Error(`Failed to update badge count: ${error}`);
  }
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('[LocalNotifications] Failed to get badge count:', error);
    return 0;
  }
}

/**
 * Clear app badge
 */
export async function clearBadge(): Promise<void> {
  try {
    await updateBadgeCount(0);
    console.log('[LocalNotifications] Badge cleared');
  } catch (error) {
    console.error('[LocalNotifications] Failed to clear badge:', error);
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  content: ScheduledNotificationContent,
  trigger: Date | LocalNotificationTrigger
): Promise<string> {
  try {
    // Prepare trigger
    let notificationTrigger: Notifications.NotificationTriggerInput;

    if (trigger instanceof Date) {
      notificationTrigger = { type: SchedulableTriggerInputTypes.DATE, date: trigger };
    } else if (trigger.date) {
      notificationTrigger = { type: SchedulableTriggerInputTypes.DATE, date: trigger.date };
    } else if (trigger.seconds) {
      notificationTrigger = {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: trigger.seconds,
        repeats: trigger.repeats || false,
      };
    } else {
      throw new Error('Invalid trigger: must provide either date or seconds');
    }

    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        subtitle: content.subtitle,
        data: content.data || {},
        sound: content.sound === undefined ? true : content.sound,
        badge: content.badge,
        categoryIdentifier: content.categoryIdentifier,
      },
      trigger: notificationTrigger,
    });

    console.log('[LocalNotifications] Notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('[LocalNotifications] Failed to schedule notification:', error);
    throw new Error(`Failed to schedule notification: ${error}`);
  }
}

/**
 * Schedule a reminder notification
 */
export async function scheduleReminder(
  originalNotificationId: string,
  content: ScheduledNotificationContent,
  reminderTime: Date
): Promise<string> {
  try {
    const notificationId = await scheduleLocalNotification(
      {
        ...content,
        title: content.title || 'Reminder',
        data: {
          ...content.data,
          originalNotificationId,
          isReminder: true,
        },
      },
      reminderTime
    );

    console.log('[LocalNotifications] Reminder scheduled for:', reminderTime);
    return notificationId;
  } catch (error) {
    console.error('[LocalNotifications] Failed to schedule reminder:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[LocalNotifications] Notification cancelled:', notificationId);
  } catch (error) {
    console.error('[LocalNotifications] Failed to cancel notification:', error);
    throw new Error(`Failed to cancel notification: ${error}`);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[LocalNotifications] All scheduled notifications cancelled');
  } catch (error) {
    console.error('[LocalNotifications] Failed to cancel all notifications:', error);
    throw new Error(`Failed to cancel all scheduled notifications: ${error}`);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[LocalNotifications] Failed to get scheduled notifications:', error);
    return [];
  }
}

/**
 * Schedule a notification with grouping (Android)
 */
export async function scheduleGroupedNotification(
  content: ScheduledNotificationContent,
  groupId: string,
  isGroupSummary: boolean = false,
  trigger: Date | LocalNotificationTrigger
): Promise<string> {
  try {
    if (Platform.OS !== 'android') {
      // Grouping only works on Android
      return await scheduleLocalNotification(content, trigger);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        subtitle: content.subtitle,
        data: content.data || {},
        sound: content.sound === undefined ? true : content.sound,
        badge: content.badge,
        categoryIdentifier: content.categoryIdentifier,
      },
      trigger: trigger instanceof Date
        ? { type: SchedulableTriggerInputTypes.DATE, date: trigger }
        : trigger.date
          ? { type: SchedulableTriggerInputTypes.DATE, date: trigger.date, channelId: trigger.channelId }
          : trigger.seconds
            ? { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: trigger.seconds, repeats: trigger.repeats || false, channelId: trigger.channelId }
            : null,
    });

    console.log('[LocalNotifications] Grouped notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('[LocalNotifications] Failed to schedule grouped notification:', error);
    throw new Error(`Failed to schedule grouped notification: ${error}`);
  }
}

/**
 * Schedule notifications for task updates
 */
export async function scheduleTaskNotification(
  taskId: string,
  title: string,
  body: string,
  triggerDate: Date,
  data?: Partial<NotificationData>
): Promise<string> {
  return await scheduleLocalNotification(
    {
      title,
      body,
      categoryIdentifier: NOTIFICATION_CATEGORIES.TASK_UPDATE,
      data: {
        screen: 'TaskDetail',
        params: { taskId },
        entityType: 'task',
        entityId: taskId,
        ...data,
      },
    },
    triggerDate
  );
}

/**
 * Schedule notifications for order updates
 */
export async function scheduleOrderNotification(
  orderId: string,
  title: string,
  body: string,
  triggerDate: Date,
  data?: Partial<NotificationData>
): Promise<string> {
  return await scheduleLocalNotification(
    {
      title,
      body,
      categoryIdentifier: NOTIFICATION_CATEGORIES.ORDER_UPDATE,
      data: {
        screen: 'OrderDetail',
        params: { orderId },
        entityType: 'order',
        entityId: orderId,
        ...data,
      },
    },
    triggerDate
  );
}

/**
 * Schedule notifications for PPE requests
 */
export async function schedulePPENotification(
  requestId: string,
  title: string,
  body: string,
  triggerDate: Date,
  data?: Partial<NotificationData>
): Promise<string> {
  return await scheduleLocalNotification(
    {
      title,
      body,
      categoryIdentifier: NOTIFICATION_CATEGORIES.PPE_REQUEST,
      data: {
        screen: 'PPERequestDetail',
        params: { requestId },
        entityType: 'ppe_request',
        entityId: requestId,
        ...data,
      },
    },
    triggerDate
  );
}

/**
 * Schedule notifications for vacation requests
 */
export async function scheduleVacationNotification(
  vacationId: string,
  title: string,
  body: string,
  triggerDate: Date,
  data?: Partial<NotificationData>
): Promise<string> {
  return await scheduleLocalNotification(
    {
      title,
      body,
      categoryIdentifier: NOTIFICATION_CATEGORIES.VACATION_REQUEST,
      data: {
        screen: 'VacationDetail',
        params: { vacationId },
        entityType: 'vacation',
        entityId: vacationId,
        ...data,
      },
    },
    triggerDate
  );
}

/**
 * Schedule notifications for stock alerts
 */
export async function scheduleStockAlertNotification(
  itemId: string,
  title: string,
  body: string,
  triggerDate: Date,
  data?: Partial<NotificationData>
): Promise<string> {
  return await scheduleLocalNotification(
    {
      title,
      body,
      categoryIdentifier: NOTIFICATION_CATEGORIES.STOCK_ALERT,
      data: {
        screen: 'ItemDetail',
        params: { itemId },
        entityType: 'item',
        entityId: itemId,
        ...data,
      },
    },
    triggerDate
  );
}

/**
 * Schedule recurring daily notification
 */
export async function scheduleDailyNotification(
  content: ScheduledNotificationContent,
  hour: number,
  minute: number = 0
): Promise<string> {
  try {
    const trigger: Notifications.DailyTriggerInput = {
      type: SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        subtitle: content.subtitle,
        data: content.data || {},
        sound: content.sound === undefined ? true : content.sound,
      },
      trigger,
    });

    console.log('[LocalNotifications] Daily notification scheduled at', `${hour}:${minute}`);
    return notificationId;
  } catch (error) {
    console.error('[LocalNotifications] Failed to schedule daily notification:', error);
    throw new Error(`Failed to schedule daily notification: ${error}`);
  }
}

/**
 * Schedule recurring weekly notification
 */
export async function scheduleWeeklyNotification(
  content: ScheduledNotificationContent,
  weekday: number, // 1 = Sunday, 2 = Monday, etc.
  hour: number,
  minute: number = 0
): Promise<string> {
  try {
    const trigger: Notifications.WeeklyTriggerInput = {
      type: SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        subtitle: content.subtitle,
        data: content.data || {},
        sound: content.sound === undefined ? true : content.sound,
      },
      trigger,
    });

    console.log(
      '[LocalNotifications] Weekly notification scheduled for weekday',
      weekday,
      `at ${hour}:${minute}`
    );
    return notificationId;
  } catch (error) {
    console.error('[LocalNotifications] Failed to schedule weekly notification:', error);
    throw new Error(`Failed to schedule weekly notification: ${error}`);
  }
}
