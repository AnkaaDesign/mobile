import { useCallback } from 'react';
import Toast from 'react-native-toast-message';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive' | 'success';
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const { title, description, variant = 'default' } = options;

    let type: 'success' | 'error' | 'info' = 'info';
    if (variant === 'destructive') type = 'error';
    if (variant === 'success') type = 'success';

    Toast.show({
      type,
      text1: title,
      text2: description,
      visibilityTime: options.duration || 4000,
    });
  }, []);

  return { toast };
}

// Legacy showToast function for backward compatibility
export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  Toast.show({
    type: type === 'warning' ? 'info' : type,
    text1: message,
    visibilityTime: 4000,
  });
}

export { Toast };