// packages/types/src/notification.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { NOTIFICATION_TYPE, NOTIFICATION_CHANNEL, NOTIFICATION_IMPORTANCE, ORDER_BY_DIRECTION } from '@/constants';
import type { User, UserIncludes, UserOrderBy } from "./user";

// =====================
// Seen Notification Interface
// =====================

export interface SeenNotification extends BaseEntity {
  userId: string;
  notificationId: string;
  seenAt: Date;

  // Relations
  user?: User;
  notification?: Notification;
}

// =====================
// Main Entity Interface
// =====================

export interface Notification extends BaseEntity {
  userId: string | null;
  title: string;
  body: string;
  type: NOTIFICATION_TYPE;
  channel: NOTIFICATION_CHANNEL[];
  importance: NOTIFICATION_IMPORTANCE;
  actionType: string | null;
  actionUrl: string | null;
  scheduledAt: Date | null;
  sentAt: Date | null;

  // Relations
  user?: User;
  seenBy?: SeenNotification[];

  // Computed fields (not in DB)
  typeOrder?: number;
  importanceOrder?: number;
  isSeenByUser?: boolean; // Helper field to check if seen by specific user
}

// =====================
// Include Types
// =====================

export interface NotificationIncludes {
  user?:
    | boolean
    | {
        include?: UserIncludes;
      };
  seenBy?:
    | boolean
    | {
        include?: SeenNotificationIncludes;
      };
}

export interface SeenNotificationIncludes {
  user?:
    | boolean
    | {
        include?: UserIncludes;
      };
  notification?:
    | boolean
    | {
        include?: NotificationIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface NotificationOrderBy {
  id?: ORDER_BY_DIRECTION;
  title?: ORDER_BY_DIRECTION;
  body?: ORDER_BY_DIRECTION;
  type?: ORDER_BY_DIRECTION;
  importance?: ORDER_BY_DIRECTION;
  importanceOrder?: ORDER_BY_DIRECTION;
  actionType?: ORDER_BY_DIRECTION;
  actionUrl?: ORDER_BY_DIRECTION;
  scheduledAt?: ORDER_BY_DIRECTION;
  sentAt?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  user?: UserOrderBy;
}

export interface SeenNotificationOrderBy {
  id?: ORDER_BY_DIRECTION;
  seenAt?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  user?: UserOrderBy;
  notification?: NotificationOrderBy;
}

// =====================
// Response Interfaces
// =====================

// Notification responses
export type NotificationGetUniqueResponse = BaseGetUniqueResponse<Notification>;
export type NotificationGetManyResponse = BaseGetManyResponse<Notification>;
export type NotificationCreateResponse = BaseCreateResponse<Notification>;
export type NotificationUpdateResponse = BaseUpdateResponse<Notification>;
export type NotificationDeleteResponse = BaseDeleteResponse;

// SeenNotification responses
export type SeenNotificationGetUniqueResponse = BaseGetUniqueResponse<SeenNotification>;
export type SeenNotificationGetManyResponse = BaseGetManyResponse<SeenNotification>;
export type SeenNotificationCreateResponse = BaseCreateResponse<SeenNotification>;
export type SeenNotificationUpdateResponse = BaseUpdateResponse<SeenNotification>;
export type SeenNotificationDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

// Notification batch operations
export type NotificationBatchCreateResponse<T = any> = BaseBatchResponse<Notification, T>;
export type NotificationBatchUpdateResponse<T = any> = BaseBatchResponse<Notification, T & { id: string }>;
export type NotificationBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// SeenNotification batch operations
export type SeenNotificationBatchCreateResponse<T = any> = BaseBatchResponse<SeenNotification, T>;
export type SeenNotificationBatchUpdateResponse<T = any> = BaseBatchResponse<SeenNotification, T & { id: string }>;
export type SeenNotificationBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// =====================
// User Notification Preference Interface
// =====================

export interface UserNotificationPreference extends BaseEntity {
  userId: string;
  notificationType: NOTIFICATION_TYPE;
  eventType: string | null;
  enabled: boolean;
  channels: NOTIFICATION_CHANNEL[];
  isMandatory: boolean;
  mandatoryChannels: NOTIFICATION_CHANNEL[];

  // Relations
  user?: User;
}

// =====================
// User Notification Preference Include Types
// =====================

export interface UserNotificationPreferenceIncludes {
  user?:
    | boolean
    | {
        include?: UserIncludes;
      };
}

// =====================
// User Notification Preference Order By
// =====================

export interface UserNotificationPreferenceOrderBy {
  id?: ORDER_BY_DIRECTION;
  notificationType?: ORDER_BY_DIRECTION;
  eventType?: ORDER_BY_DIRECTION;
  enabled?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  user?: UserOrderBy;
}

// =====================
// User Notification Preference Response Interfaces
// =====================

export type UserNotificationPreferenceGetUniqueResponse = BaseGetUniqueResponse<UserNotificationPreference>;
export type UserNotificationPreferenceGetManyResponse = BaseGetManyResponse<UserNotificationPreference>;
export type UserNotificationPreferenceCreateResponse = BaseCreateResponse<UserNotificationPreference>;
export type UserNotificationPreferenceUpdateResponse = BaseUpdateResponse<UserNotificationPreference>;
export type UserNotificationPreferenceDeleteResponse = BaseDeleteResponse;
