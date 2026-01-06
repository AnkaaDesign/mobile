/**
 * Sound and Vibration Service
 *
 * Manages custom notification sounds and vibration patterns.
 * Provides different feedback patterns for different notification types.
 */

import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { NOTIFICATION_IMPORTANCE } from '@/constants';

export interface VibrationPattern {
  pattern: number[];
  repeat?: boolean;
}

export interface SoundConfig {
  sound: string | boolean;
  critical?: boolean;
  volume?: number;
}

/**
 * Custom notification sounds
 * Place sound files in assets/sounds/ directory
 */
export const NOTIFICATION_SOUNDS = {
  DEFAULT: 'default',
  URGENT: 'urgent.wav',
  SUCCESS: 'success.wav',
  WARNING: 'warning.wav',
  INFO: 'info.wav',
  TASK: 'task.wav',
  ORDER: 'order.wav',
  MESSAGE: 'message.wav',
} as const;

/**
 * Vibration patterns (in milliseconds)
 * Format: [wait, vibrate, wait, vibrate, ...]
 */
export const VIBRATION_PATTERNS = {
  DEFAULT: [0, 250, 100, 250],
  URGENT: [0, 100, 50, 100, 50, 100, 50, 400],
  SUCCESS: [0, 200],
  WARNING: [0, 300, 100, 300],
  DOUBLE_PULSE: [0, 200, 100, 200],
  TRIPLE_PULSE: [0, 150, 100, 150, 100, 150],
  LONG: [0, 500],
  SHORT: [0, 100],
} as const;

/**
 * Get sound configuration based on notification importance
 */
export function getSoundForImportance(
  importance: NOTIFICATION_IMPORTANCE
): string | boolean {
  const soundMap: Record<NOTIFICATION_IMPORTANCE, string | boolean> = {
    [NOTIFICATION_IMPORTANCE.LOW]: NOTIFICATION_SOUNDS.INFO,
    [NOTIFICATION_IMPORTANCE.NORMAL]: NOTIFICATION_SOUNDS.DEFAULT,
    [NOTIFICATION_IMPORTANCE.HIGH]: NOTIFICATION_SOUNDS.WARNING,
    [NOTIFICATION_IMPORTANCE.URGENT]: NOTIFICATION_SOUNDS.URGENT,
  };

  return soundMap[importance] || NOTIFICATION_SOUNDS.DEFAULT;
}

/**
 * Get vibration pattern based on notification importance
 */
export function getVibrationForImportance(
  importance: NOTIFICATION_IMPORTANCE
): number[] {
  const vibrationMap: Record<NOTIFICATION_IMPORTANCE, number[]> = {
    [NOTIFICATION_IMPORTANCE.LOW]: VIBRATION_PATTERNS.SHORT,
    [NOTIFICATION_IMPORTANCE.NORMAL]: VIBRATION_PATTERNS.DEFAULT,
    [NOTIFICATION_IMPORTANCE.HIGH]: VIBRATION_PATTERNS.DOUBLE_PULSE,
    [NOTIFICATION_IMPORTANCE.URGENT]: VIBRATION_PATTERNS.URGENT,
  };

  return vibrationMap[importance] || VIBRATION_PATTERNS.DEFAULT;
}

/**
 * Trigger haptic feedback for notification
 */
export async function triggerNotificationHaptic(
  importance: NOTIFICATION_IMPORTANCE = NOTIFICATION_IMPORTANCE.NORMAL
): Promise<void> {
  try {
    const hapticMap: Record<NOTIFICATION_IMPORTANCE, Haptics.ImpactFeedbackStyle> = {
      [NOTIFICATION_IMPORTANCE.LOW]: Haptics.ImpactFeedbackStyle.Light,
      [NOTIFICATION_IMPORTANCE.NORMAL]: Haptics.ImpactFeedbackStyle.Medium,
      [NOTIFICATION_IMPORTANCE.HIGH]: Haptics.ImpactFeedbackStyle.Heavy,
      [NOTIFICATION_IMPORTANCE.URGENT]: Haptics.ImpactFeedbackStyle.Heavy,
    };

    const style = hapticMap[importance] || Haptics.ImpactFeedbackStyle.Medium;

    await Haptics.impactAsync(style);

    // For urgent notifications, add an extra haptic
    if (importance === NOTIFICATION_IMPORTANCE.URGENT) {
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
    }
  } catch (error) {
    console.error('[SoundVibration] Failed to trigger haptic feedback:', error);
  }
}

/**
 * Trigger success haptic feedback
 */
export async function triggerSuccessHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.error('[SoundVibration] Failed to trigger success haptic:', error);
  }
}

/**
 * Trigger warning haptic feedback
 */
export async function triggerWarningHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.error('[SoundVibration] Failed to trigger warning haptic:', error);
  }
}

/**
 * Trigger error haptic feedback
 */
export async function triggerErrorHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.error('[SoundVibration] Failed to trigger error haptic:', error);
  }
}

/**
 * Trigger selection haptic feedback
 */
export async function triggerSelectionHaptic(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.error('[SoundVibration] Failed to trigger selection haptic:', error);
  }
}

/**
 * Create notification channel with custom sound (Android)
 */
export async function createNotificationChannel(
  channelId: string,
  channelName: string,
  importance: Notifications.AndroidImportance,
  options?: {
    sound?: string;
    vibrationPattern?: number[];
    enableVibration?: boolean;
    enableLights?: boolean;
    lightColor?: string;
    showBadge?: boolean;
    description?: string;
  }
): Promise<void> {
  try {
    if (Platform.OS !== 'android') {
      console.log('[SoundVibration] Notification channels only supported on Android');
      return;
    }

    await Notifications.setNotificationChannelAsync(channelId, {
      name: channelName,
      importance,
      sound: options?.sound,
      vibrationPattern: options?.vibrationPattern,
      enableVibrate: options?.enableVibration ?? true,
      enableLights: options?.enableLights ?? true,
      lightColor: options?.lightColor,
      showBadge: options?.showBadge ?? true,
      description: options?.description,
    });

    console.log(`[SoundVibration] Notification channel created: ${channelId}`);
  } catch (error) {
    console.error('[SoundVibration] Failed to create notification channel:', error);
    throw new Error(`Failed to create notification channel: ${error}`);
  }
}

/**
 * Setup default notification channels (Android)
 */
export async function setupDefaultNotificationChannels(): Promise<void> {
  try {
    if (Platform.OS !== 'android') {
      return;
    }

    // Default channel
    await createNotificationChannel(
      'default',
      'Default Notifications',
      Notifications.AndroidImportance.DEFAULT,
      {
        sound: NOTIFICATION_SOUNDS.DEFAULT as string,
        vibrationPattern: VIBRATION_PATTERNS.DEFAULT,
        description: 'General app notifications',
      }
    );

    // Urgent channel
    await createNotificationChannel(
      'urgent',
      'Urgent Notifications',
      Notifications.AndroidImportance.HIGH,
      {
        sound: NOTIFICATION_SOUNDS.URGENT,
        vibrationPattern: VIBRATION_PATTERNS.URGENT,
        enableLights: true,
        lightColor: '#FF0000',
        description: 'Important and time-sensitive notifications',
      }
    );

    // Task updates channel
    await createNotificationChannel(
      'tasks',
      'Task Updates',
      Notifications.AndroidImportance.DEFAULT,
      {
        sound: NOTIFICATION_SOUNDS.TASK,
        vibrationPattern: VIBRATION_PATTERNS.DOUBLE_PULSE,
        description: 'Updates about your tasks',
      }
    );

    // Order updates channel
    await createNotificationChannel(
      'orders',
      'Order Updates',
      Notifications.AndroidImportance.DEFAULT,
      {
        sound: NOTIFICATION_SOUNDS.ORDER,
        vibrationPattern: VIBRATION_PATTERNS.DEFAULT,
        description: 'Updates about your orders',
      }
    );

    // Stock alerts channel
    await createNotificationChannel(
      'stock',
      'Stock Alerts',
      Notifications.AndroidImportance.HIGH,
      {
        sound: NOTIFICATION_SOUNDS.WARNING,
        vibrationPattern: VIBRATION_PATTERNS.WARNING,
        enableLights: true,
        lightColor: '#FFA500',
        description: 'Stock level alerts and warnings',
      }
    );

    // Silent channel
    await createNotificationChannel(
      'silent',
      'Silent Notifications',
      Notifications.AndroidImportance.LOW,
      {
        sound: undefined,
        enableVibration: false,
        enableLights: false,
        description: 'Silent notifications without sound or vibration',
      }
    );

    console.log('[SoundVibration] All notification channels created successfully');
  } catch (error) {
    console.error('[SoundVibration] Failed to setup notification channels:', error);
    throw error;
  }
}

/**
 * Get notification channel for importance level
 */
export function getChannelIdForImportance(
  importance: NOTIFICATION_IMPORTANCE
): string {
  const channelMap: Record<NOTIFICATION_IMPORTANCE, string> = {
    [NOTIFICATION_IMPORTANCE.LOW]: 'silent',
    [NOTIFICATION_IMPORTANCE.NORMAL]: 'default',
    [NOTIFICATION_IMPORTANCE.HIGH]: 'tasks',
    [NOTIFICATION_IMPORTANCE.URGENT]: 'urgent',
  };

  return channelMap[importance] || 'default';
}

/**
 * Get notification channel for entity type
 */
export function getChannelIdForEntityType(entityType: string): string {
  const channelMap: Record<string, string> = {
    task: 'tasks',
    order: 'orders',
    stock: 'stock',
    ppe: 'default',
    vacation: 'default',
    warning: 'urgent',
    general: 'default',
  };

  return channelMap[entityType.toLowerCase()] || 'default';
}

/**
 * Delete a notification channel (Android)
 */
export async function deleteNotificationChannel(channelId: string): Promise<void> {
  try {
    if (Platform.OS !== 'android') {
      return;
    }

    await Notifications.deleteNotificationChannelAsync(channelId);
    console.log(`[SoundVibration] Notification channel deleted: ${channelId}`);
  } catch (error) {
    console.error('[SoundVibration] Failed to delete notification channel:', error);
    throw new Error(`Failed to delete notification channel: ${error}`);
  }
}

/**
 * Get all notification channels (Android)
 */
export async function getAllNotificationChannels(): Promise<
  Notifications.NotificationChannel[]
> {
  try {
    if (Platform.OS !== 'android') {
      return [];
    }

    return await Notifications.getNotificationChannelsAsync();
  } catch (error) {
    console.error('[SoundVibration] Failed to get notification channels:', error);
    return [];
  }
}

/**
 * SoundVibrationService class for centralized management
 */
export class SoundVibrationService {
  private static instance: SoundVibrationService;
  private hapticsEnabled: boolean = true;
  private soundsEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): SoundVibrationService {
    if (!SoundVibrationService.instance) {
      SoundVibrationService.instance = new SoundVibrationService();
    }
    return SoundVibrationService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      await setupDefaultNotificationChannels();
      console.log('[SoundVibration] Service initialized');
    } catch (error) {
      console.error('[SoundVibration] Initialization failed:', error);
      throw error;
    }
  }

  public enableHaptics(enabled: boolean): void {
    this.hapticsEnabled = enabled;
  }

  public enableSounds(enabled: boolean): void {
    this.soundsEnabled = enabled;
  }

  public isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  public isSoundsEnabled(): boolean {
    return this.soundsEnabled;
  }

  public async triggerHaptic(
    importance: NOTIFICATION_IMPORTANCE = NOTIFICATION_IMPORTANCE.NORMAL
  ): Promise<void> {
    if (!this.hapticsEnabled) {
      return;
    }

    await triggerNotificationHaptic(importance);
  }
}

export const soundVibrationService = SoundVibrationService.getInstance();
