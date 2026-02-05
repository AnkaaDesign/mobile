import { ReactNode } from 'react';
import { Platform } from 'react-native';

// Try to import the real push notifications context
// This will fail in Expo Go but succeed in dev builds
let PushNotificationsProvider: React.ComponentType<{ children: ReactNode }>;
let usePushNotifications: () => any;

const isExpoGo = !Platform.select({
  native: typeof (global as { expo?: { modules?: { ExpoNotifications?: unknown } } }).expo?.modules?.ExpoNotifications !== 'undefined',
  default: false,
});

try {
  // Try to load the actual implementation
  const module = require('./push-notifications-context');
  PushNotificationsProvider = module.PushNotificationsProvider;
  usePushNotifications = module.usePushNotifications;
} catch (error) {
  console.warn('Push notifications not available (Expo Go detected), using mock provider');

  // Fallback provider that does nothing
  PushNotificationsProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

  // Fallback hook that returns mock values
  usePushNotifications = () => ({
    expoPushToken: null,
    notification: null,
    isRegistered: false,
    registerToken: async () => {
      console.log('Push notifications not available in Expo Go');
    },
    unregisterToken: async () => {
      console.log('Push notifications not available in Expo Go');
    },
  });
}

export { PushNotificationsProvider, usePushNotifications };
