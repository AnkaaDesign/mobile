import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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

  // Get project ID from app.json
  const projectId = 'f8f06f52-853f-4ab6-a783-181208687fa7';

  // Handle notification received while app is in foreground
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    setNotification(notification);
  }, []);

  // Handle notification tap - navigate to deep link
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    console.log('Notification tapped:', response);

    const deepLink = handleNotificationTap(response);

    if (deepLink) {
      try {
        // Parse deep link and navigate
        // Expected format: ankaadesign://path or https://ankaadesign.com/app/path
        let path = deepLink;

        // Remove scheme if present
        if (path.startsWith('ankaadesign://')) {
          path = path.replace('ankaadesign://', '/');
        } else if (path.includes('/app/')) {
          // Extract path after /app/
          const appIndex = path.indexOf('/app/');
          path = path.substring(appIndex + 4);
        }

        // Ensure path starts with /
        if (!path.startsWith('/')) {
          path = '/' + path;
        }

        console.log('Navigating to:', path);
        router.push(path as any);
      } catch (error) {
        console.error('Error navigating from notification:', error);
      }
    }
  }, [router]);

  // Register push token with backend
  const registerToken = useCallback(async () => {
    if (!Device.isDevice) {
      console.log('[PUSH] Push notifications only work on physical devices');
      return;
    }

    try {
      console.log('[PUSH] Requesting push token...');
      const token = await registerForPushNotifications(projectId);

      if (!token) {
        console.log('[PUSH] Failed to get push token');
        return;
      }

      console.log('[PUSH] ========================================');
      console.log('[PUSH] TOKEN:', token);
      console.log('[PUSH] ========================================');

      setExpoPushToken(token);

      // Show alert in dev mode for easy copying
      if (__DEV__) {
        Alert.alert(
          'Push Token',
          token,
          [{ text: 'OK' }],
          { cancelable: true }
        );
      }

      // Register token with backend if user is authenticated
      if (isAuthenticated) {
        const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

        await pushNotificationService.registerToken({
          token,
          platform,
        });

        setIsRegistered(true);
        console.log('[PUSH] Token registered with backend successfully');
      } else {
        console.log('[PUSH] User not authenticated, token not registered with backend');
      }
    } catch (error) {
      console.error('[PUSH] Error registering push token:', error);
    }
  }, [isAuthenticated, projectId]);

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
