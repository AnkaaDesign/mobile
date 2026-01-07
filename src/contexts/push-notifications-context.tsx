import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {
  registerForPushNotifications,
  setupNotificationListeners,
  handleNotificationTap,
  getLastNotificationResponse,
  setBadgeCount,
} from '@/lib/notifications';
import { pushNotificationService } from '@/api-client';
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
  const { user, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const hasHandledInitialNotification = useRef(false);

  // Get project ID from app.json dynamically
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'f8f06f52-853f-4ab6-a783-181208687fa7';

  // Log project ID for debugging
  useEffect(() => {
    console.log('[PUSH] Using Expo Project ID:', projectId);
  }, []);

  // Handle notification received while app is in foreground
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    setNotification(notification);
  }, []);

  // Handle notification tap - navigate to deep link
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    console.log('[PUSH] ========================================');
    console.log('[PUSH] Notification tapped - processing response');
    console.log('[PUSH] Action identifier:', response.actionIdentifier);
    console.log('[PUSH] Notification ID:', response.notification.request.identifier);
    console.log('[PUSH] Notification data:', JSON.stringify(response.notification.request.content.data, null, 2));
    console.log('[PUSH] ========================================');

    const deepLink = handleNotificationTap(response);
    console.log('[PUSH] Deep link extracted:', deepLink || 'No deep link found');

    if (deepLink) {
      try {
        // Parse deep link and navigate
        // Expected format: ankaadesign://path or https://ankaadesign.com/app/path
        let path = deepLink;
        console.log('[PUSH] Original deep link:', path);

        // Remove scheme if present
        if (path.startsWith('ankaadesign://')) {
          path = path.replace('ankaadesign://', '/');
          console.log('[PUSH] Removed custom scheme, path:', path);
        } else if (path.includes('/app/')) {
          // Extract path after /app/
          const appIndex = path.indexOf('/app/');
          path = path.substring(appIndex + 4);
          console.log('[PUSH] Extracted path after /app/, path:', path);
        }

        // Ensure path starts with /
        if (!path.startsWith('/')) {
          path = '/' + path;
          console.log('[PUSH] Added leading slash, path:', path);
        }

        console.log('[PUSH] ✅ Final navigation path:', path);
        console.log('[PUSH] Navigating...');
        router.push(path as any);
        console.log('[PUSH] ✅ Navigation initiated successfully');
      } catch (error: any) {
        console.error('[PUSH] ========================================');
        console.error('[PUSH] ❌ Error navigating from notification');
        console.error('[PUSH] Error:', error?.message);
        console.error('[PUSH] Stack:', error?.stack);
        console.error('[PUSH] ========================================');
      }
    } else {
      console.warn('[PUSH] ⚠️ No deep link to navigate to');
      console.log('[PUSH] Notification will be displayed but no navigation will occur');
    }
  }, [router]);

  // Register push token with backend
  const registerToken = useCallback(async () => {
    console.log('[PUSH] ========================================');
    console.log('[PUSH] Starting token registration flow');
    console.log('[PUSH] Device check:', Device.isDevice ? 'Physical device' : 'Simulator/Emulator');
    console.log('[PUSH] Platform:', Platform.OS);
    console.log('[PUSH] Authenticated:', isAuthenticated);
    console.log('[PUSH] ========================================');

    if (!Device.isDevice) {
      console.warn('[PUSH] ⚠️ Push notifications only work on physical devices');
      return;
    }

    try {
      console.log('[PUSH] Step 1: Requesting Expo push token...');
      const token = await registerForPushNotifications(projectId);

      if (!token) {
        console.error('[PUSH] ❌ Failed to get push token - registerForPushNotifications returned null/undefined');
        console.log('[PUSH] Possible causes:');
        console.log('[PUSH]   - User denied notification permissions');
        console.log('[PUSH]   - Device not configured for push notifications');
        console.log('[PUSH]   - Expo project ID mismatch');
        return;
      }

      console.log('[PUSH] ✅ Step 1 Complete: Received Expo push token');
      console.log('[PUSH] Token:', token);
      console.log('[PUSH] Token length:', token.length);
      console.log('[PUSH] Token format:', token.startsWith('ExponentPushToken[') ? 'Valid Expo format' : 'Invalid format');

      setExpoPushToken(token);

      // Show alert in dev mode for easy copying
      if (__DEV__) {
        Alert.alert(
          'Push Token Received',
          `${token}\n\nPlatform: ${Platform.OS}\nAuthenticated: ${isAuthenticated}`,
          [{ text: 'OK' }],
          { cancelable: true }
        );
      }

      // Register token with backend if user is authenticated
      if (isAuthenticated) {
        const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

        console.log('[PUSH] Step 2: Registering token with backend...');
        console.log('[PUSH] Platform:', platform);
        console.log('[PUSH] User ID:', user?.id || 'unknown');

        await pushNotificationService.registerToken({
          token,
          platform,
        });

        setIsRegistered(true);
        console.log('[PUSH] ✅ Step 2 Complete: Token registered with backend successfully');
        console.log('[PUSH] ========================================');
        console.log('[PUSH] 🎉 Registration flow completed successfully!');
        console.log('[PUSH] ========================================');
      } else {
        console.warn('[PUSH] ⚠️ Step 2 Skipped: User not authenticated');
        console.log('[PUSH] Token will be registered when user logs in');
      }
    } catch (error: any) {
      console.error('[PUSH] ========================================');
      console.error('[PUSH] ❌ Error during push token registration');
      console.error('[PUSH] Error type:', error?.constructor?.name);
      console.error('[PUSH] Error message:', error?.message);
      console.error('[PUSH] Error details:', JSON.stringify(error, null, 2));
      console.error('[PUSH] Stack trace:', error?.stack);
      console.error('[PUSH] ========================================');
    }
  }, [isAuthenticated, projectId, user]);

  // Unregister push token
  const unregisterToken = useCallback(async () => {
    if (!expoPushToken) return;

    try {
      await pushNotificationService.unregisterToken(expoPushToken);
      setIsRegistered(false);
      console.log('Push token unregistered');
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }, [expoPushToken]);

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
        console.log('App launched from notification:', response);
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
