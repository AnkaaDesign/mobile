import { useCallback, useRef } from "react";
import { Alert, Platform, ToastAndroid } from "react-native";

interface ToastOptions {
  title: string;
  description?: string | string[];
  variant?: "success" | "error" | "warning" | "info";
  duration?: "short" | "long";
  allowDuplicate?: boolean;
}

// Simple mobile toast manager to prevent duplicates
class MobileToastManager {
  private lastToasts = new Map<string, number>(); // key -> timestamp
  private retryAlerts = new Map<string, boolean>(); // retryKey -> isShowing

  private generateKey(title: string, description?: string | string[]): string {
    const desc = Array.isArray(description) ? description.join("") : description || "";
    return `${title}:${desc}`.toLowerCase().replace(/\s+/g, " ");
  }

  shouldShow(title: string, description?: string | string[], allowDuplicate = false): boolean {
    if (allowDuplicate) return true;

    const key = this.generateKey(title, description);
    const now = Date.now();
    const lastShown = this.lastToasts.get(key);

    // Don't show if the same toast was shown within the last 3 seconds
    if (lastShown && now - lastShown < 3000) {
      return false;
    }

    this.lastToasts.set(key, now);
    return true;
  }

  setRetryShowing(url: string, method: string, isShowing: boolean) {
    const key = `${method}:${url}`;
    this.retryAlerts.set(key, isShowing);
  }

  isRetryShowing(url: string, method: string): boolean {
    const key = `${method}:${url}`;
    return this.retryAlerts.get(key) || false;
  }
}

export function useToast() {
  const managerRef = useRef(new MobileToastManager());
  const manager = managerRef.current;

  const toast = useCallback(
    (options: ToastOptions) => {
      // Check for duplicates
      if (!manager.shouldShow(options.title, options.description, options.allowDuplicate)) {
        return;
      }

      // Format description - handle arrays of error messages
      const formattedDescription = Array.isArray(options.description) ? options.description.join("\n") : options.description;

      if (Platform.OS === "android") {
        const message = formattedDescription ? `${options.title}\n${formattedDescription}` : options.title;

        // Use longer duration for errors or when there's detailed description
        const duration =
          options.duration === "long" || options.variant === "error" || (formattedDescription && formattedDescription.length > 100) ? ToastAndroid.LONG : ToastAndroid.SHORT;

        ToastAndroid.show(message, duration);
      } else {
        // iOS doesn't have native toast, so we use Alert
        // For errors with detailed messages, show them properly
        const alertTitle =
          options.variant === "error"
            ? `❌ ${options.title}`
            : options.variant === "success"
              ? `✅ ${options.title}`
              : options.variant === "warning"
                ? `⚠️ ${options.title}`
                : options.title;

        Alert.alert(alertTitle, formattedDescription, [{ text: "OK" }]);
      }
    },
    [manager],
  );

  // Helper methods for common use cases
  const success = useCallback(
    (title: string, description?: string | string[], options?: { allowDuplicate?: boolean }) => {
      toast({ title, description, variant: "success", allowDuplicate: options?.allowDuplicate });
    },
    [toast],
  );

  const error = useCallback(
    (title: string, description?: string | string[], options?: { allowDuplicate?: boolean }) => {
      toast({ title, description, variant: "error", duration: "long", allowDuplicate: options?.allowDuplicate });
    },
    [toast],
  );

  const warning = useCallback(
    (title: string, description?: string | string[], options?: { allowDuplicate?: boolean }) => {
      toast({ title, description, variant: "warning", allowDuplicate: options?.allowDuplicate });
    },
    [toast],
  );

  const info = useCallback(
    (title: string, description?: string | string[], options?: { allowDuplicate?: boolean }) => {
      toast({ title, description, variant: "info", allowDuplicate: options?.allowDuplicate });
    },
    [toast],
  );

  // Retry-specific toast for mobile
  const retry = useCallback(
    (title: string, description: string, url: string, method: string, attempt: number, maxAttempts: number) => {
      // Don't show multiple retry alerts for the same request
      if (manager.isRetryShowing(url, method)) {
        return;
      }

      manager.setRetryShowing(url, method, true);

      const retryDescription = `${description}\n\nTentativa ${attempt} de ${maxAttempts}`;

      if (Platform.OS === "android") {
        const message = `🔄 ${title}\n${retryDescription}`;
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Alert.alert(`🔄 ${title}`, retryDescription, [
          {
            text: "OK",
            onPress: () => manager.setRetryShowing(url, method, false),
          },
        ]);
      }

      // Auto-clear retry flag after 10 seconds
      setTimeout(() => {
        manager.setRetryShowing(url, method, false);
      }, 10000);
    },
    [manager],
  );

  return { toast, success, error, warning, info, retry, manager };
}
