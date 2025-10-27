import { notify } from '../api-client';
import { Platform, Alert, ToastAndroid } from "react-native";

// Global mobile toast manager instance
class GlobalMobileToastManager {
  private lastToasts = new Map<string, number>(); // key -> timestamp
  private retryAlerts = new Map<string, boolean>(); // retryKey -> isShowing

  private generateKey(title: string, description?: string): string {
    const desc = description || "";
    // Normalize the key by removing timestamps, request IDs, and other variable parts
    const normalizedDesc = desc
      .replace(/\d{13}/g, '') // Remove timestamps
      .replace(/req_\w+/g, '') // Remove request IDs
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    return `${title}:${normalizedDesc}`.toLowerCase();
  }

  shouldShow(title: string, description?: string): boolean {
    const key = this.generateKey(title, description);
    const now = Date.now();
    const lastShown = this.lastToasts.get(key);

    // Don't show if the same toast was shown within the last 5 seconds
    // Increased from 3 to 5 seconds to better handle React Query retries
    if (lastShown && now - lastShown < 5000) {
      console.log(`[TOAST DEBUG] Blocking duplicate toast: "${title}" (last shown ${now - lastShown}ms ago)`);
      return false;
    }

    this.lastToasts.set(key, now);

    // Clean up old entries to prevent memory leaks
    if (this.lastToasts.size > 100) {
      const oldestKeys = Array.from(this.lastToasts.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, 50)
        .map(([k]) => k);
      oldestKeys.forEach(k => this.lastToasts.delete(k));
    }

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

const globalManager = new GlobalMobileToastManager();

// Setup mobile notification handler using native components with duplicate prevention
export function setupMobileNotifications() {
  try {
    notify.setHandler((type, title, message, options) => {
      // Format message - handle arrays or long messages
      const formattedMessage = Array.isArray(message) ? message.join("\n") : message;

      // Check for duplicates
      if (!globalManager.shouldShow(title, formattedMessage)) {
        return;
      }

      const displayMessage = formattedMessage ? `${title}\n${formattedMessage}` : title;

      if (Platform.OS === "android") {
        // Use longer duration for errors or detailed messages
        const duration = type === "error" || options?.duration === 10000 || (formattedMessage && formattedMessage.length > 100) ? ToastAndroid.LONG : ToastAndroid.SHORT;

        ToastAndroid.show(displayMessage, duration);
      } else {
        // Use iOS alert with emoji indicators for better visibility
        const alertTitle = type === "error" ? `❌ ${title}` : type === "success" ? `✅ ${title}` : type === "warning" ? `⚠️ ${title}` : `ℹ️ ${title}`;

        Alert.alert(alertTitle, formattedMessage || "", [{ text: "OK" }]);
      }
    });

    // Setup retry notification handler
    notify.setRetryHandler((title, description, url, method, attempt, maxAttempts) => {
      // Don't show multiple retry alerts for the same request
      if (globalManager.isRetryShowing(url, method)) {
        return;
      }

      globalManager.setRetryShowing(url, method, true);

      const retryDescription = `${description}\n\nTentativa ${attempt} de ${maxAttempts}`;

      if (Platform.OS === "android") {
        const message = `🔄 ${title}\n${retryDescription}`;
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Alert.alert(`🔄 ${title}`, retryDescription, [
          {
            text: "OK",
            onPress: () => globalManager.setRetryShowing(url, method, false),
          },
        ]);
      }

      // Auto-clear retry flag after 10 seconds
      setTimeout(() => {
        globalManager.setRetryShowing(url, method, false);
      }, 10000);
    });

    // Setup dismiss retry handler
    notify.setDismissRetryHandler((url, method) => {
      globalManager.setRetryShowing(url, method, false);
    });
  } catch (error) {
    console.error("Failed to setup mobile notifications:", error);
  }
}
