/**
 * Notification Service Type Definitions
 *
 * Centralized type definitions for the notification service.
 */

import type * as Notifications from 'expo-notifications';
import type { NOTIFICATION_IMPORTANCE, NOTIFICATION_TYPE } from '@/constants';

/**
 * Notification content for creating notifications
 */
export interface NotificationContent {
  title: string;
  body: string;
  subtitle?: string;
  data?: NotificationDataPayload;
  sound?: boolean | string;
  badge?: number;
  categoryIdentifier?: string;
  priority?: Notifications.AndroidNotificationPriority;
}

/**
 * Data payload for notifications
 */
export interface NotificationDataPayload {
  // Navigation
  url?: string;
  screen?: string;
  params?: Record<string, any>;

  // Entity information
  entityType?: string;
  entityId?: string;

  // Notification metadata
  notificationId?: string;
  importance?: NOTIFICATION_IMPORTANCE;
  type?: NOTIFICATION_TYPE;

  // Flags
  isReminder?: boolean;
  requiresAction?: boolean;

  // Custom data
  [key: string]: any;
}

/**
 * Scheduled notification request
 */
export interface ScheduledNotificationRequest {
  identifier: string;
  content: NotificationContent;
  trigger: NotificationTrigger;
}

/**
 * Notification trigger types
 */
export type NotificationTrigger =
  | DateTrigger
  | TimeIntervalTrigger
  | DailyTrigger
  | WeeklyTrigger
  | CalendarTrigger;

export interface DateTrigger {
  type: 'date';
  date: Date;
}

export interface TimeIntervalTrigger {
  type: 'timeInterval';
  seconds: number;
  repeats?: boolean;
}

export interface DailyTrigger {
  type: 'daily';
  hour: number;
  minute: number;
  repeats?: boolean;
}

export interface WeeklyTrigger {
  type: 'weekly';
  weekday: number; // 1 = Sunday, 2 = Monday, etc.
  hour: number;
  minute: number;
  repeats?: boolean;
}

export interface CalendarTrigger {
  type: 'calendar';
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  weekday?: number;
  repeats?: boolean;
}

/**
 * Notification action result
 */
export interface NotificationActionResult {
  success: boolean;
  error?: Error;
  data?: any;
}

/**
 * Notification channel configuration (Android)
 */
export interface NotificationChannelConfig {
  id: string;
  name: string;
  importance: Notifications.AndroidImportance;
  description?: string;
  sound?: string;
  vibrationPattern?: number[];
  enableVibrate?: boolean;
  enableLights?: boolean;
  lightColor?: string;
  showBadge?: boolean;
  bypassDnd?: boolean;
  lockscreenVisibility?: Notifications.AndroidNotificationVisibility;
}

/**
 * Notification category configuration (iOS)
 */
export interface NotificationCategoryConfig {
  identifier: string;
  actions: NotificationActionConfig[];
  options?: {
    previewPlaceholder?: string;
    categorySummaryFormat?: string;
    customDismissAction?: boolean;
    allowInCarPlay?: boolean;
    showTitle?: boolean;
    showSubtitle?: boolean;
  };
}

/**
 * Notification action configuration
 */
export interface NotificationActionConfig {
  identifier: string;
  buttonTitle: string;
  options?: {
    opensAppToForeground?: boolean;
    isAuthenticationRequired?: boolean;
    isDestructive?: boolean;
  };
  textInput?: {
    submitButtonTitle: string;
    placeholder: string;
  };
}

/**
 * Push notification token info
 */
export interface PushTokenInfo {
  token: string;
  type: 'expo' | 'apns' | 'fcm';
  userId?: string;
  deviceId?: string;
  platform: 'ios' | 'android';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
  byImportance: Record<string, number>;
}

/**
 * Notification preference
 */
export interface NotificationPreference {
  userId: string;
  enabled: boolean;
  enabledTypes: NOTIFICATION_TYPE[];
  enabledChannels: string[];
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
  enableSounds: boolean;
  enableVibration: boolean;
  enableBadge: boolean;
}

/**
 * Notification group (Android)
 */
export interface NotificationGroup {
  groupId: string;
  groupName: string;
  notifications: Notifications.Notification[];
  summaryNotification?: Notifications.Notification;
}

/**
 * Scheduled notification info
 */
export interface ScheduledNotificationInfo {
  id: string;
  title: string;
  body: string;
  scheduledFor: Date;
  entityType?: string;
  entityId?: string;
  categoryIdentifier?: string;
}

/**
 * Notification handler context
 */
export interface NotificationHandlerContext {
  notification: Notifications.Notification;
  actionIdentifier?: string;
  userText?: string;
  timestamp: Date;
}

/**
 * Background sync status
 */
export interface BackgroundSyncStatus {
  isRegistered: boolean;
  lastSyncTime?: Date;
  nextSyncTime?: Date;
  status: 'available' | 'denied' | 'restricted';
  failureCount: number;
}

/**
 * Notification service status
 */
export interface NotificationServiceStatus {
  isInitialized: boolean;
  hasPermissions: boolean;
  hasDeviceToken: boolean;
  backgroundSyncEnabled: boolean;
  categoriesRegistered: number;
  channelsRegistered: number;
}

/**
 * Error types
 */
export enum NotificationErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  SCHEDULING_FAILED = 'SCHEDULING_FAILED',
  BACKGROUND_FETCH_UNAVAILABLE = 'BACKGROUND_FETCH_UNAVAILABLE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Notification error
 */
export interface NotificationError extends Error {
  type: NotificationErrorType;
  details?: any;
}
