import { View, Text, TouchableOpacity } from 'react-native';
import { usePushNotifications } from '@/contexts/push-notifications-context-wrapper';
import { useState } from 'react';

/**
 * Example component showing push notification status and controls
 * This can be added to a settings screen or debug panel
 */
export function PushNotificationStatus() {
  const { expoPushToken, isRegistered, registerToken, unregisterToken } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await registerToken();
    } catch (error) {
      console.error('Failed to register:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnregister = async () => {
    setIsLoading(true);
    try {
      await unregisterToken();
    } catch (error) {
      console.error('Failed to unregister:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="p-4 bg-white rounded-lg shadow">
      <Text className="text-lg font-semibold mb-2">Push Notifications</Text>

      <View className="mb-4">
        <Text className="text-sm text-gray-600 mb-1">Status:</Text>
        <Text className={`text-sm font-medium ${isRegistered ? 'text-green-600' : 'text-gray-500'}`}>
          {isRegistered ? 'Registered' : 'Not Registered'}
        </Text>
      </View>

      {expoPushToken && (
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Push Token:</Text>
          <Text className="text-xs font-mono bg-gray-100 p-2 rounded" numberOfLines={2}>
            {expoPushToken}
          </Text>
        </View>
      )}

      <View className="flex-row gap-2">
        {!isRegistered ? (
          <TouchableOpacity
            className="flex-1 bg-blue-500 px-4 py-2 rounded"
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-medium">
              {isLoading ? 'Registering...' : 'Register'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="flex-1 bg-red-500 px-4 py-2 rounded"
            onPress={handleUnregister}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-medium">
              {isLoading ? 'Unregistering...' : 'Unregister'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
