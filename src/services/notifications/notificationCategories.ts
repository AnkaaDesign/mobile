/**
 * Notification Categories Service
 *
 * Manages iOS notification categories and action buttons.
 * Categories allow users to interact with notifications without opening the app.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationCategory {
  identifier: string;
  actions: NotificationAction[];
  options?: {
    previewPlaceholder?: string;
    categorySummaryFormat?: string;
    customDismissAction?: boolean;
    allowInCarPlay?: boolean;
    showTitle?: boolean;
    showSubtitle?: boolean;
  };
}

export interface NotificationAction {
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
 * Standard notification categories for the app
 */
export const NOTIFICATION_CATEGORIES = {
  TASK_UPDATE: 'task-update',
  ORDER_UPDATE: 'order-update',
  PPE_REQUEST: 'ppe-request',
  VACATION_REQUEST: 'vacation-request',
  STOCK_ALERT: 'stock-alert',
  GENERAL: 'general',
} as const;

/**
 * Standard notification actions
 */
export const NOTIFICATION_ACTIONS = {
  VIEW: 'view',
  APPROVE: 'approve',
  REJECT: 'reject',
  REMIND_LATER: 'remind',
  DISMISS: 'dismiss',
  REPLY: 'reply',
  MARK_READ: 'mark-read',
} as const;

/**
 * NotificationCategoriesService class for managing notification categories
 */
export class NotificationCategoriesService {
  private static instance: NotificationCategoriesService;
  private registeredCategories: Set<string> = new Set();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): NotificationCategoriesService {
    if (!NotificationCategoriesService.instance) {
      NotificationCategoriesService.instance = new NotificationCategoriesService();
    }
    return NotificationCategoriesService.instance;
  }

  /**
   * Initialize and register all notification categories
   */
  public async initialize(): Promise<void> {
    try {
      // Only iOS supports notification categories
      if (Platform.OS !== 'ios') {
        console.log('[NotificationCategories] Categories only supported on iOS');
        return;
      }

      await this.setupTaskUpdateCategory();
      await this.setupOrderUpdateCategory();
      await this.setupPPERequestCategory();
      await this.setupVacationRequestCategory();
      await this.setupStockAlertCategory();
      await this.setupGeneralCategory();

      console.log('[NotificationCategories] All categories registered successfully');
    } catch (error) {
      console.error('[NotificationCategories] Failed to initialize categories:', error);
      throw new Error(`Failed to initialize notification categories: ${error}`);
    }
  }

  /**
   * Set up task update notification category
   */
  private async setupTaskUpdateCategory(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(
        NOTIFICATION_CATEGORIES.TASK_UPDATE,
        [
          {
            identifier: NOTIFICATION_ACTIONS.VIEW,
            buttonTitle: 'View Task',
            options: { opensAppToForeground: true },
          },
          {
            identifier: NOTIFICATION_ACTIONS.REMIND_LATER,
            buttonTitle: 'Remind Later',
            options: { opensAppToForeground: false },
          },
          {
            identifier: NOTIFICATION_ACTIONS.MARK_READ,
            buttonTitle: 'Mark Read',
            options: { opensAppToForeground: false },
          },
        ],
        {
          previewPlaceholder: 'Task Update',
          categorySummaryFormat: '%u task updates',
        }
      );

      this.registeredCategories.add(NOTIFICATION_CATEGORIES.TASK_UPDATE);
      console.log('[NotificationCategories] Task update category registered');
    } catch (error) {
      console.error('[NotificationCategories] Failed to setup task update category:', error);
      throw error;
    }
  }

  /**
   * Set up order update notification category
   */
  private async setupOrderUpdateCategory(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(
        NOTIFICATION_CATEGORIES.ORDER_UPDATE,
        [
          {
            identifier: NOTIFICATION_ACTIONS.VIEW,
            buttonTitle: 'View Order',
            options: { opensAppToForeground: true },
          },
          {
            identifier: NOTIFICATION_ACTIONS.DISMISS,
            buttonTitle: 'Dismiss',
            options: { opensAppToForeground: false },
          },
        ],
        {
          previewPlaceholder: 'Order Update',
          categorySummaryFormat: '%u order updates',
        }
      );

      this.registeredCategories.add(NOTIFICATION_CATEGORIES.ORDER_UPDATE);
      console.log('[NotificationCategories] Order update category registered');
    } catch (error) {
      console.error('[NotificationCategories] Failed to setup order update category:', error);
      throw error;
    }
  }

  /**
   * Set up PPE request notification category
   */
  private async setupPPERequestCategory(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(
        NOTIFICATION_CATEGORIES.PPE_REQUEST,
        [
          {
            identifier: NOTIFICATION_ACTIONS.APPROVE,
            buttonTitle: 'Approve',
            options: {
              opensAppToForeground: true,
              isAuthenticationRequired: true,
            },
          },
          {
            identifier: NOTIFICATION_ACTIONS.REJECT,
            buttonTitle: 'Reject',
            options: {
              opensAppToForeground: true,
              isDestructive: true,
              isAuthenticationRequired: true,
            },
          },
          {
            identifier: NOTIFICATION_ACTIONS.VIEW,
            buttonTitle: 'View Details',
            options: { opensAppToForeground: true },
          },
        ],
        {
          previewPlaceholder: 'PPE Request',
          categorySummaryFormat: '%u PPE requests',
        }
      );

      this.registeredCategories.add(NOTIFICATION_CATEGORIES.PPE_REQUEST);
      console.log('[NotificationCategories] PPE request category registered');
    } catch (error) {
      console.error('[NotificationCategories] Failed to setup PPE request category:', error);
      throw error;
    }
  }

  /**
   * Set up vacation request notification category
   */
  private async setupVacationRequestCategory(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(
        NOTIFICATION_CATEGORIES.VACATION_REQUEST,
        [
          {
            identifier: NOTIFICATION_ACTIONS.APPROVE,
            buttonTitle: 'Approve',
            options: {
              opensAppToForeground: true,
              isAuthenticationRequired: true,
            },
          },
          {
            identifier: NOTIFICATION_ACTIONS.REJECT,
            buttonTitle: 'Reject',
            options: {
              opensAppToForeground: true,
              isDestructive: true,
              isAuthenticationRequired: true,
            },
          },
          {
            identifier: NOTIFICATION_ACTIONS.VIEW,
            buttonTitle: 'View Details',
            options: { opensAppToForeground: true },
          },
        ],
        {
          previewPlaceholder: 'Vacation Request',
          categorySummaryFormat: '%u vacation requests',
        }
      );

      this.registeredCategories.add(NOTIFICATION_CATEGORIES.VACATION_REQUEST);
      console.log('[NotificationCategories] Vacation request category registered');
    } catch (error) {
      console.error('[NotificationCategories] Failed to setup vacation request category:', error);
      throw error;
    }
  }

  /**
   * Set up stock alert notification category
   */
  private async setupStockAlertCategory(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(
        NOTIFICATION_CATEGORIES.STOCK_ALERT,
        [
          {
            identifier: NOTIFICATION_ACTIONS.VIEW,
            buttonTitle: 'View Stock',
            options: { opensAppToForeground: true },
          },
          {
            identifier: NOTIFICATION_ACTIONS.REMIND_LATER,
            buttonTitle: 'Remind Later',
            options: { opensAppToForeground: false },
          },
        ],
        {
          previewPlaceholder: 'Stock Alert',
          categorySummaryFormat: '%u stock alerts',
        }
      );

      this.registeredCategories.add(NOTIFICATION_CATEGORIES.STOCK_ALERT);
      console.log('[NotificationCategories] Stock alert category registered');
    } catch (error) {
      console.error('[NotificationCategories] Failed to setup stock alert category:', error);
      throw error;
    }
  }

  /**
   * Set up general notification category
   */
  private async setupGeneralCategory(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(
        NOTIFICATION_CATEGORIES.GENERAL,
        [
          {
            identifier: NOTIFICATION_ACTIONS.VIEW,
            buttonTitle: 'View',
            options: { opensAppToForeground: true },
          },
          {
            identifier: NOTIFICATION_ACTIONS.DISMISS,
            buttonTitle: 'Dismiss',
            options: { opensAppToForeground: false },
          },
        ],
        {
          previewPlaceholder: 'Notification',
          categorySummaryFormat: '%u notifications',
        }
      );

      this.registeredCategories.add(NOTIFICATION_CATEGORIES.GENERAL);
      console.log('[NotificationCategories] General category registered');
    } catch (error) {
      console.error('[NotificationCategories] Failed to setup general category:', error);
      throw error;
    }
  }

  /**
   * Register a custom notification category
   */
  public async registerCategory(
    identifier: string,
    actions: NotificationAction[],
    options?: NotificationCategory['options']
  ): Promise<void> {
    try {
      if (Platform.OS !== 'ios') {
        console.warn('[NotificationCategories] Custom categories only supported on iOS');
        return;
      }

      await Notifications.setNotificationCategoryAsync(identifier, actions, options);

      this.registeredCategories.add(identifier);
      console.log(`[NotificationCategories] Custom category registered: ${identifier}`);
    } catch (error) {
      console.error('[NotificationCategories] Failed to register custom category:', error);
      throw new Error(`Failed to register category ${identifier}: ${error}`);
    }
  }

  /**
   * Delete a notification category
   */
  public async deleteCategory(identifier: string): Promise<void> {
    try {
      if (Platform.OS !== 'ios') {
        return;
      }

      await Notifications.deleteNotificationCategoryAsync(identifier);

      this.registeredCategories.delete(identifier);
      console.log(`[NotificationCategories] Category deleted: ${identifier}`);
    } catch (error) {
      console.error('[NotificationCategories] Failed to delete category:', error);
      throw new Error(`Failed to delete category ${identifier}: ${error}`);
    }
  }

  /**
   * Get all registered category identifiers
   */
  public getRegisteredCategories(): string[] {
    return Array.from(this.registeredCategories);
  }

  /**
   * Check if a category is registered
   */
  public isCategoryRegistered(identifier: string): boolean {
    return this.registeredCategories.has(identifier);
  }
}

// Export singleton instance
export const notificationCategoriesService = NotificationCategoriesService.getInstance();
