/**
 * Example: Basic Notification Setup
 *
 * This example shows how to set up notifications in your root App component.
 */

import React, { useEffect } from 'react';
import { Alert, Button, View, Text, StyleSheet } from 'react-native';
import { useNotifications } from '@/hooks/useNotifications';
import type * as Notifications from 'expo-notifications';

interface AppProps {
  currentUser?: {
    id: string;
    name: string;
  };
}

export default function App({ currentUser }: AppProps) {
  const {
    permissions,
    deviceToken,
    isInitialized,
    isLoading,
    error,
    requestPermissions,
    updateBadge,
    clearBadge,
  } = useNotifications({
    userId: currentUser?.id,
    autoInitialize: true,
    enableBackgroundSync: true,
    onNotificationReceived: handleNotificationReceived,
    onNotificationTapped: handleNotificationTapped,
  });

  /**
   * Handle notification received while app is in foreground
   */
  function handleNotificationReceived(notification: Notifications.Notification) {
    console.log('Notification received:', notification);

    // Show in-app notification or update UI
    const title = notification.request.content.title;
    const body = notification.request.content.body;

    // You can show a toast, banner, or update a notification list
    Alert.alert(title || 'Notification', body || '');
  }

  /**
   * Handle notification tapped (app opened from notification)
   */
  function handleNotificationTapped(response: Notifications.NotificationResponse) {
    console.log('Notification tapped:', response);

    // Navigation is handled automatically by the notification handler service
    // But you can add custom logic here if needed
    const data = response.notification.request.content.data;

    if (data?.entityType === 'task' && data?.entityId) {
      // Additional task-specific logic
      console.log('Opening task:', data.entityId);
    }
  }

  /**
   * Request permissions if not granted
   */
  useEffect(() => {
    if (permissions && !permissions.granted && permissions.canAskAgain) {
      // Show explanation before requesting permissions
      Alert.alert(
        'Enable Notifications',
        'Stay updated with important notifications about tasks, orders, and more.',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Enable',
            onPress: () => requestPermissions(),
          },
        ]
      );
    }
  }, [permissions, requestPermissions]);

  /**
   * Handle initialization errors
   */
  useEffect(() => {
    if (error) {
      console.error('Notification error:', error);
      Alert.alert('Notification Error', error.message);
    }
  }, [error]);

  /**
   * Register device token with backend when available
   */
  useEffect(() => {
    if (deviceToken && currentUser) {
      // Send token to your backend
      registerDeviceTokenWithBackend(currentUser.id, deviceToken.token);
    }
  }, [deviceToken, currentUser]);

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.container}>
        <Text>Initializing notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Status</Text>

      {/* Permission Status */}
      <View style={styles.section}>
        <Text style={styles.label}>Permissions:</Text>
        <Text style={styles.value}>
          {permissions?.granted ? 'Granted' : 'Not Granted'}
        </Text>
      </View>

      {/* Device Token */}
      <View style={styles.section}>
        <Text style={styles.label}>Device Token:</Text>
        <Text style={styles.value} numberOfLines={1}>
          {deviceToken?.token || 'Not available'}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {!permissions?.granted && (
          <Button title="Request Permissions" onPress={requestPermissions} />
        )}

        <Button title="Update Badge (5)" onPress={() => updateBadge(5)} />
        <Button title="Clear Badge" onPress={clearBadge} />
      </View>

      {/* Your app content */}
      <YourAppContent />
    </View>
  );
}

async function registerDeviceTokenWithBackend(userId: string, token: string) {
  try {
    // Replace with your actual API call
    console.log('Registering device token:', { userId, token });

    // Example:
    // await fetch('https://api.example.com/device-tokens', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId, token }),
    // });
  } catch (error) {
    console.error('Failed to register device token:', error);
  }
}

function YourAppContent() {
  return (
    <View style={styles.content}>
      <Text>Your app content here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    marginTop: 20,
    gap: 10,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
});
