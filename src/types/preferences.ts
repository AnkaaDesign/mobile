// packages/types/src/preferences.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { COLOR_SCHEMA, NOTIFICATION_CHANNEL, NOTIFICATION_IMPORTANCE, ORDER_BY_DIRECTION } from '@/constants';
import type { User, UserIncludes, UserOrderBy } from "./user";

// =====================
// Notification Preferences Interface
// =====================

export interface NotificationPreference extends BaseEntity {
  notificationType: string; // ALERT_TYPE from enums
  enabled: boolean;
  channels: NOTIFICATION_CHANNEL[];
  importance: NOTIFICATION_IMPORTANCE;

  // Relations
  preferences?: Preferences[];
}

// =====================
// Main Preferences Interface
// =====================

export interface Preferences extends BaseEntity {
  userId: string;
  colorSchema: COLOR_SCHEMA;
  favorites?: string[]; // Array of FAVORITE_PAGES enum values

  // Relations
  user?: User;
  notifications?: NotificationPreference[];
}

// =====================
// Include Types
// =====================

export interface NotificationPreferenceIncludes {
  preferences?:
    | boolean
    | {
        include?: PreferencesIncludes;
      };
}

export interface PreferencesIncludes {
  user?:
    | boolean
    | {
        include?: UserIncludes;
      };
  notifications?:
    | boolean
    | {
        include?: NotificationPreferenceIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface NotificationPreferenceOrderBy {
  id?: ORDER_BY_DIRECTION;
  notificationType?: ORDER_BY_DIRECTION;
  enabled?: ORDER_BY_DIRECTION;
  importance?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

export interface PreferencesOrderBy {
  id?: ORDER_BY_DIRECTION;
  userId?: ORDER_BY_DIRECTION;
  colorSchema?: ORDER_BY_DIRECTION;
  favorites?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  user?: UserOrderBy;
  notifications?: NotificationPreferenceOrderBy;
}

// =====================
// Response Interfaces
// =====================

// NotificationPreference responses
export type NotificationPreferenceGetUniqueResponse = BaseGetUniqueResponse<NotificationPreference>;
export type NotificationPreferenceGetManyResponse = BaseGetManyResponse<NotificationPreference>;
export type NotificationPreferenceCreateResponse = BaseCreateResponse<NotificationPreference>;
export type NotificationPreferenceUpdateResponse = BaseUpdateResponse<NotificationPreference>;
export type NotificationPreferenceDeleteResponse = BaseDeleteResponse;

// Preferences responses
export type PreferencesGetUniqueResponse = BaseGetUniqueResponse<Preferences>;
export type PreferencesGetManyResponse = BaseGetManyResponse<Preferences>;
export type PreferencesCreateResponse = BaseCreateResponse<Preferences>;
export type PreferencesUpdateResponse = BaseUpdateResponse<Preferences>;
export type PreferencesDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

// NotificationPreference batch operations
export type NotificationPreferenceBatchCreateResponse<T = any> = BaseBatchResponse<NotificationPreference, T>;
export type NotificationPreferenceBatchUpdateResponse<T = any> = BaseBatchResponse<NotificationPreference, T & { id: string }>;
export type NotificationPreferenceBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// Preferences batch operations
export type PreferencesBatchCreateResponse<T = any> = BaseBatchResponse<Preferences, T>;
export type PreferencesBatchUpdateResponse<T = any> = BaseBatchResponse<Preferences, T & { id: string }>;
export type PreferencesBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
