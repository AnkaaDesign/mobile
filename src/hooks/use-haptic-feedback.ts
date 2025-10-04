import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export function useHapticFeedback() {
  const lightImpact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const mediumImpact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const heavyImpact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const selection = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const notification = useCallback((type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  }, []);

  return {
    lightImpact,
    mediumImpact,
    heavyImpact,
    selection,
    notification,
  };
}