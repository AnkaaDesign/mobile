import { Platform, ToastAndroid } from "react-native";
import * as Haptics from "expo-haptics";

interface ToastOptions {
  duration?: "short" | "long";
  position?: "top" | "bottom" | "center";
  withHaptics?: boolean;
}

class Toast {
  private static showNative(message: string, duration: "short" | "long" = "short") {
    if (Platform.OS === "android") {
      const androidDuration = duration === "short" ? ToastAndroid.SHORT : ToastAndroid.LONG;
      ToastAndroid.show(message, androidDuration);
    } else {
      // For iOS, we'll need to use a different approach or a library
      // For now, just log to console
      console.log(`Toast: ${message}`);
      // In production, you might want to use a library like react-native-toast-message
      // or create a custom toast component
    }
  }

  static success(message: string, options: ToastOptions = {}) {
    const { duration = "short", withHaptics = true } = options;

    if (withHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    this.showNative(`✅ ${message}`, duration);
  }

  static error(message: string, options: ToastOptions = {}) {
    const { duration = "long", withHaptics = true } = options;

    if (withHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    this.showNative(`❌ ${message}`, duration);
  }

  static warning(message: string, options: ToastOptions = {}) {
    const { duration = "short", withHaptics = true } = options;

    if (withHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    this.showNative(`⚠️ ${message}`, duration);
  }

  static info(message: string, options: ToastOptions = {}) {
    const { duration = "short", withHaptics = false } = options;

    if (withHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    this.showNative(`ℹ️ ${message}`, duration);
  }

  static show(message: string, options: ToastOptions = {}) {
    const { duration = "short", withHaptics = false } = options;

    if (withHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    this.showNative(message, duration);
  }
}

export const toast = Toast;
export default Toast;