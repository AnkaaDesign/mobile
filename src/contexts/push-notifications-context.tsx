import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
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
  const hasAttemptedRegistration = useRef(false);

  // Get project ID from app.json dynamically
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'f8f06f52-853f-4ab6-a783-181208687fa7';

  // Handle notification received while app is in foreground
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    setNotification(notification);
  }, []);

  // Handle notification tap - navigate to deep link
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const deepLink = handleNotificationTap(response);

    if (deepLink) {
      try {
        let path = deepLink;

        // Remove scheme if present
        if (path.startsWith('ankaadesign://')) {
          path = path.replace('ankaadesign://', '/');
        } else if (path.includes('/app/')) {
          const appIndex = path.indexOf('/app/');
          path = path.substring(appIndex + 4);
        }

        // Ensure path starts with /
        if (!path.startsWith('/')) {
          path = '/' + path;
        }

        router.push(path as any);
      } catch (error: any) {
        // Navigation error - silently ignore
      }
    }
  }, [router]);

  // Register push token with backend
  const registerToken = useCallback(async () => {
    if (hasAttemptedRegistration.current) {
      return;
    }

    if (!Device.isDevice) {
      hasAttemptedRegistration.current = true;
      return;
    }

    hasAttemptedRegistration.current = true;

    try {
      const token = await registerForPushNotifications(projectId);

      if (!token) {
        return;
      }

      setExpoPushToken(token);

      // Register token with backend if user is authenticated
      if (isAuthenticated) {
        const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

        try {
          await pushNotificationService.registerToken({
            token,
            platform,
          });

          setIsRegistered(true);
        } catch (backendError: any) {
          // Backend registration failed - still mark as registered locally
          setIsRegistered(true);
        }
      }
    } catch (error: any) {
      // Error during push token registration
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
