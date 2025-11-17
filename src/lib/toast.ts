// This file is deprecated in favor of @/components/ui/toast
// Kept for backward compatibility, but now uses the custom toast implementation
import { showToast as customShowToast } from "@/components/ui/toast";
import * as Haptics from "expo-haptics";

interface ToastOptions {
  duration?: "short" | "long";
  position?: "top" | "bottom" | "center";
  withHaptics?: boolean;
}

class Toast {
  static success(message: string, options: ToastOptions = {}) {
    const { duration = "short", withHaptics = true, position = "top" } = options;

    if (withHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    customShowToast({
      message,
      type: "success",
      duration: duration === "short" ? 3000 : 5000,
      position,
    });
  }

  static error(message: string, options: ToastOptions = {}) {
    const { duration = "long", withHaptics = true, position = "top" } = options;

    if (withHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    customShowToast({
      message,
      type: "error",
      duration: duration === "short" ? 3000 : 5000,
      position,
    });
  }

  static warning(message: string, options: ToastOptions = {}) {
    const { duration = "short", withHaptics = true, position = "top" } = options;

    if (withHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    customShowToast({
      message,
      type: "warning",
      duration: duration === "short" ? 3000 : 5000,
      position,
    });
  }

  static info(message: string, options: ToastOptions = {}) {
    const { duration = "short", withHaptics = false, position = "top" } = options;

    if (withHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    customShowToast({
      message,
      type: "info",
      duration: duration === "short" ? 3000 : 5000,
      position,
    });
  }

  static show(message: string, options: ToastOptions = {}) {
    const { duration = "short", withHaptics = false, position = "top" } = options;

    if (withHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    customShowToast({
      message,
      type: "info",
      duration: duration === "short" ? 3000 : 5000,
      position,
    });
  }
}

// Also export the new showToast function for direct use
export { showToast } from "@/components/ui/toast";
export const toast = Toast;
export default Toast;