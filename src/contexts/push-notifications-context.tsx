import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

// DEBUG: Flag to enable/disable debug alerts for testing
const DEBUG_PUSH_NOTIFICATIONS = false;
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import {
  registerForPushNotifications,
  setupNotificationListeners,
  handleNotificationTap,
  getLastNotificationResponse,
  setBadgeCount,
} from '@/lib/notifications';
import { notificationCategoriesService } from '@/services/notifications/notificationCategories';
import { parseDeepLink, generateNotificationLink, ENTITY_ALIAS_MAP, ROUTE_MAP } from '@/lib/deep-linking';
import { pushNotificationService, markAsRead, notify } from '@/api-client';
import { notificationKeys } from '@/hooks/queryKeys';
import { useAuth } from './auth-context';

interface PushNotificationsContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  registerToken: () => Promise<void>;
  unregisterToken: () => Promise<void>;
}

interface PushNotificationsProviderProps {
  children: ReactNode;
}

const PushNotificationsContext = createContext<PushNotificationsContextType>({} as PushNotificationsContextType);

export const PushNotificationsProvider = ({ children }: PushNotificationsProviderProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const hasHandledInitialNotification = useRef(false);
  const hasAttemptedRegistration = useRef(false);

  // Get project ID from app.json dynamically
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'f8f06f52-853f-4ab6-a783-181208687fa7';

  // Handle notification received while app is in foreground
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    setNotification(notification);
  }, []);

  /**
   * Extract mobile deep link from actionUrl
   * Handles multiple formats:
   * 1. Direct mobile URL: "ankaadesign://task/123"
   * 2. Embedded JSON: 'http://localhost:5173{"web":"...", "mobile":"ankaadesign://...", "universalLink":"..."}'
   * 3. JSON object with mobile field: {"web":"...", "mobile":"ankaadesign://...", "universalLink":"..."}
   */
  const extractMobileUrl = useCallback((actionUrl: string): string | null => {
    try {
      // If it's already a mobile deep link, return it
      if (actionUrl.startsWith('ankaadesign://')) {
        return actionUrl;
      }

      // Try to find embedded JSON in the URL (API sends malformed data like "http://localhost:5173{...}")
      const jsonStartIndex = actionUrl.indexOf('{');
      if (jsonStartIndex !== -1) {
        const jsonString = actionUrl.substring(jsonStartIndex);
        try {
          const parsed = JSON.parse(jsonString);
          // Check for mobile field
          if (parsed.mobile && typeof parsed.mobile === 'string') {
            return parsed.mobile;
          }
          // Check for universalLink as fallback
          if (parsed.universalLink && typeof parsed.universalLink === 'string') {
            return parsed.universalLink;
          }
        } catch {
          // JSON parse failed, continue to other methods
        }
      }

      // Try parsing the whole string as JSON
      try {
        const parsed = JSON.parse(actionUrl);
        if (parsed.mobile && typeof parsed.mobile === 'string') {
          return parsed.mobile;
        }
        if (parsed.universalLink && typeof parsed.universalLink === 'string') {
          return parsed.universalLink;
        }
      } catch {
        // Not valid JSON
      }

      // Return original URL as fallback
      return actionUrl;
    } catch (error) {
      console.error('[Push Notification] Error extracting mobile URL:', error);
      return null;
    }
  }, []);

  // Handle notification tap - navigate to deep link
  const handleNotificationResponse = useCallback(async (response: Notifications.NotificationResponse) => {
    try {
      // Suppress success toasts while handling notification tap
      // This prevents "Sucesso" toasts from API calls made during navigation
      notify.setSuppressSuccessToasts(true, 5000);

      const data = response.notification.request.content.data as Record<string, string | undefined>;
      const title = response.notification.request.content.title;
      const body = response.notification.request.content.body;

      if (DEBUG_PUSH_NOTIFICATIONS) {
        Alert.alert(
          '🔔 Push Notification Tapped',
          `Title: ${title}\nBody: ${body}\nData: ${JSON.stringify(data, null, 2)}`,
          [{ text: 'OK' }]
        );
      }

      // Mark notification as read if we have the notificationId and user is authenticated
      const notificationId = data?.notificationId || data?.id;
      if (notificationId && user?.id) {
        try {
          await markAsRead(notificationId, user.id);
          // Invalidate notification queries to update the unread count
          queryClient.invalidateQueries({ queryKey: notificationKeys.unread(user.id) });
          queryClient.invalidateQueries({ queryKey: notificationKeys.byUser(user.id) });
          queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        } catch (error) {
          // Silently fail - don't block navigation if marking as read fails
          console.warn('[Push Notification] Failed to mark notification as read:', error);
        }
      }

      // Priority 1: Use entityType + entityId if available (most reliable for API notifications)
      if (data?.entityType && data?.entityId) {
        let entityType = data.entityType;
        let entityId = data.entityId;

        // Special handling for SERVICE_ORDER - navigate to parent Task instead
        // ServiceOrders don't have their own detail page in mobile, they're viewed within Task
        if (
          (entityType === 'SERVICE_ORDER' || entityType === 'ServiceOrder' || entityType === 'SERVICEORDER') &&
          data?.taskId
        ) {
          entityType = 'TASK';
          entityId = data.taskId;
          console.log('[Push Notification] SERVICE_ORDER -> redirecting to parent Task:', { taskId: entityId });
        }

        // Map API entity types (e.g., 'TASK') to our ROUTE_MAP keys (e.g., 'Task')
        const mappedEntityType = ENTITY_ALIAS_MAP[entityType] || entityType;

        if (mappedEntityType && ROUTE_MAP[mappedEntityType as keyof typeof ROUTE_MAP]) {
          const route = ROUTE_MAP[mappedEntityType as keyof typeof ROUTE_MAP];
          const finalRoute = route.replace('[id]', entityId);
          console.log('[Push Notification] Navigating via entity:', { entityType: mappedEntityType, id: entityId, route: finalRoute });

          if (DEBUG_PUSH_NOTIFICATIONS) {
            Alert.alert(
              '➡️ Push Nav - Entity Route',
              `EntityType: ${entityType}\nMapped: ${mappedEntityType}\nID: ${entityId}\nRoute: ${finalRoute}`,
              [{ text: 'OK' }]
            );
          }

          router.push(finalRoute as any);
          return;
        }
      }

      // Priority 2: Try direct mobileUrl from notification data (set by queue processor)
      // This is the most efficient path when API properly sets mobileUrl in the push payload
      if (data?.mobileUrl && typeof data.mobileUrl === 'string' && data.mobileUrl.length > 0) {
        const parsed = parseDeepLink(data.mobileUrl);
        console.log('[Push Notification] Navigating via direct mobileUrl:', { mobileUrl: data.mobileUrl, parsed });

        if (DEBUG_PUSH_NOTIFICATIONS) {
          Alert.alert(
            '➡️ Push Nav - Direct Mobile URL',
            `MobileUrl: ${data.mobileUrl}\nParsed Route: ${parsed.route}`,
            [{ text: 'OK' }]
          );
        }

        if (parsed.route && parsed.route !== '/(tabs)') {
          router.push(parsed.route as any);
          return;
        }
      }

      // Priority 3: Try actionUrl from notification data (may contain embedded JSON with mobile URL)
      if (data?.actionUrl && typeof data.actionUrl === 'string') {
        const mobileUrl = extractMobileUrl(data.actionUrl);

        if (mobileUrl) {
          const parsed = parseDeepLink(mobileUrl);
          console.log('[Push Notification] Navigating via extracted mobile URL:', { original: data.actionUrl, mobileUrl, parsed });

          if (DEBUG_PUSH_NOTIFICATIONS) {
            Alert.alert(
              '➡️ Push Nav - Extracted Mobile URL',
              `Original: ${data.actionUrl.substring(0, 50)}...\nExtracted: ${mobileUrl}\nParsed Route: ${parsed.route}`,
              [{ text: 'OK' }]
            );
          }

          if (parsed.route && parsed.route !== '/(tabs)') {
            router.push(parsed.route as any);
            return;
          }
        }
      }

      // Priority 4: Use the deep link returned by handleNotificationTap (legacy fallback)
      const deepLink = handleNotificationTap(response);

      if (deepLink) {
        // Use parseDeepLink to properly handle all URL formats
        // (custom scheme, universal links, paths)
        const parsed = parseDeepLink(deepLink);
        console.log('[Push Notification] Navigating via parseDeepLink:', { deepLink, parsed });

        if (DEBUG_PUSH_NOTIFICATIONS) {
          Alert.alert(
            '➡️ Push Nav - Deep Link',
            `DeepLink: ${deepLink}\nParsed Route: ${parsed.route}`,
            [{ text: 'OK' }]
          );
        }

        if (parsed.route && parsed.route !== '/(tabs)') {
          router.push(parsed.route as any);
          return;
        }
      }

      console.log('[Push Notification] No valid route found in notification data');
      if (DEBUG_PUSH_NOTIFICATIONS) {
        Alert.alert('⚠️ Push Nav - No Route', 'No valid route found in notification data');
      }
    } catch (error: any) {
      console.error('[Push Notification] Navigation error:', error);
      if (DEBUG_PUSH_NOTIFICATIONS) {
        Alert.alert('❌ Push Nav Error', `Error: ${error?.message || error}`);
      }
    } finally {
      // Reset toast suppression after a short delay to allow navigation to complete
      setTimeout(() => {
        notify.setSuppressSuccessToasts(false);
      }, 1000);
    }
  }, [router, extractMobileUrl, user?.id, queryClient]);

  // Register push token with backend
  const registerToken = useCallback(async () => {
    if (hasAttemptedRegistration.current) {
      return;
    }

    if (!Device.isDevice) {
      hasAttemptedRegistration.current = true;
      if (DEBUG_PUSH_NOTIFICATIONS) {
        Alert.alert('⚠️ Push Token', 'Not a physical device - push notifications unavailable');
      }
      return;
    }

    hasAttemptedRegistration.current = true;

    try {
      const token = await registerForPushNotifications(projectId);

      if (!token) {
        if (DEBUG_PUSH_NOTIFICATIONS) {
          Alert.alert('⚠️ Push Token', 'Failed to get push token');
        }
        return;
      }

      setExpoPushToken(token);

      // Get device ID for deduplication (prevents duplicate notifications from multiple app installs)
      let deviceId: string | null = null;
      try {
        if (Platform.OS === 'ios') {
          deviceId = await Application.getIosIdForVendorAsync();
        } else {
          deviceId = Application.getAndroidId();
        }
      } catch (deviceIdError) {
        console.warn('[Push Token] Failed to get device ID:', deviceIdError);
      }

      if (DEBUG_PUSH_NOTIFICATIONS) {
        Alert.alert(
          '✅ Push Token Obtained',
          `Token: ${token.substring(0, 30)}...\nPlatform: ${Platform.OS}\nDeviceId: ${deviceId || 'N/A'}`,
          [{ text: 'OK' }]
        );
      }

      // Register token with backend if user is authenticated
      if (isAuthenticated) {
        const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

        try {
          await pushNotificationService.registerToken({
            token,
            platform,
            // Send deviceId to allow backend to deduplicate tokens per device
            // This prevents duplicate notifications when user has multiple app builds installed
            ...(deviceId && { deviceId }),
          });

          setIsRegistered(true);
          if (DEBUG_PUSH_NOTIFICATIONS) {
            Alert.alert('✅ Push Token Registered', `Token registered with backend successfully\nDeviceId: ${deviceId || 'N/A'}`);
          }
        } catch (backendError: any) {
          // Backend registration failed - allow retry on next app launch
          setIsRegistered(false);
          hasAttemptedRegistration.current = false;
          if (DEBUG_PUSH_NOTIFICATIONS) {
            Alert.alert('⚠️ Backend Registration Failed', `Error: ${backendError?.message || backendError}`);
          }
        }
      }
    } catch (error: any) {
      // Error during push token registration
      if (DEBUG_PUSH_NOTIFICATIONS) {
        Alert.alert('❌ Push Token Error', `Error: ${error?.message || error}`);
      }
    }
  }, [isAuthenticated, projectId]);

  // Unregister push token
  const unregisterToken = useCallback(async () => {
    if (!expoPushToken) return;

    try {
      await pushNotificationService.unregisterToken(expoPushToken);
      setIsRegistered(false);
    } catch (error) {
      // Error unregistering push token
    }
  }, [expoPushToken]);

  // Initialize notification categories (iOS action buttons)
  useEffect(() => {
    notificationCategoriesService.initialize().catch((error) => {
      console.warn('[PushNotifications] Failed to initialize notification categories:', error);
    });
  }, []);

  // Setup notification listeners
  useEffect(() => {
    const cleanup = setupNotificationListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );

    return cleanup;
  }, [handleNotificationReceived, handleNotificationResponse]);

  // Handle app launch from notification (cold start)
  useEffect(() => {
    if (hasHandledInitialNotification.current) return;

    const checkInitialNotification = async () => {
      const response = await getLastNotificationResponse();

      if (response) {
        hasHandledInitialNotification.current = true;

        // Small delay to ensure app is ready
        setTimeout(() => {
          handleNotificationResponse(response);
        }, 1000);
      }
    };

    checkInitialNotification();
  }, [handleNotificationResponse]);

  // Register token when user logs in
  useEffect(() => {
    if (isAuthenticated && !isRegistered) {
      registerToken();
    }
  }, [isAuthenticated, isRegistered, registerToken]);

  // Unregister token when user logs out
  useEffect(() => {
    if (!isAuthenticated && isRegistered) {
      unregisterToken();
      // Reset the registration flag so next login will re-register
      hasAttemptedRegistration.current = false;
    }
  }, [isAuthenticated, isRegistered, unregisterToken]);

  // Clear badge when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Clear badge when app comes to foreground
        setBadgeCount(0);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const contextValue = {
    expoPushToken,
    notification,
    isRegistered,
    registerToken,
    unregisterToken,
  };

  return (
    <PushNotificationsContext.Provider value={contextValue}>
      {children}
    </PushNotificationsContext.Provider>
  );
};

export const usePushNotifications = () => {
  const context = useContext(PushNotificationsContext);
  if (!context) {
    throw new Error('usePushNotifications must be used within a PushNotificationsProvider');
  }
  return context;
};
