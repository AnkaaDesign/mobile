import { apiClient } from './axiosClient';

export interface PushTokenRegistrationRequest {
  token: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceId?: string;
}

export interface PushTokenRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    tokenId: string;
    registered: boolean;
  };
}

/**
 * Register a push notification token with the backend
 * @param data - Push token registration data
 * @returns Registration response
 */
export async function registerPushToken(data: PushTokenRegistrationRequest) {
  const response = await apiClient.post<PushTokenRegistrationResponse>('/notifications/device-token', data);
  return response;
}

/**
 * Unregister a push notification token
 * @param token - The push token to unregister
 * @returns Unregister response
 */
export async function unregisterPushToken(token: string) {
  return apiClient.delete('/notifications/device-token', { data: { token } });
}

/**
 * Update push notification preferences
 * @param preferences - Notification preferences
 * @returns Update response
 */
export async function updatePushPreferences(preferences: {
  enabled: boolean;
  categories?: string[];
}) {
  return apiClient.patch('/notifications/preferences', preferences);
}

export const pushNotificationService = {
  registerToken: registerPushToken,
  unregisterToken: unregisterPushToken,
  updatePreferences: updatePushPreferences,
};
