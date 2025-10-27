/**
 * Platform detection utilities for API client
 * Provides safe guards for DOM APIs that don't exist in React Native
 */

/**
 * Check if we're running in a web browser environment
 */
export const isWebEnvironment = (): boolean => {
  return typeof (globalThis as any).window !== "undefined" && typeof (globalThis as any).document !== "undefined";
};

/**
 * Check if we're running in React Native environment
 */
export const isReactNativeEnvironment = (): boolean => {
  return (
    typeof (globalThis as any).window === "undefined" &&
    typeof global !== "undefined" &&
    // Check for React Native specific globals
    (typeof (globalThis as any).navigator !== "undefined" && (globalThis as any).navigator.product === "ReactNative")
  );
};

/**
 * Check if we're running in Node.js environment
 */
export const isNodeEnvironment = (): boolean => {
  return (
    typeof (globalThis as any).window === "undefined" &&
    typeof global !== "undefined" &&
    typeof process !== "undefined" &&
    process.versions?.node !== undefined
  );
};

/**
 * Safe wrapper for DOM operations that only work in web environments
 */
export const safeWebOperation = <T>(
  operation: () => T,
  fallback?: T | (() => T),
  warningMessage?: string
): T | undefined => {
  if (isWebEnvironment()) {
    try {
      return operation();
    } catch (error) {
      console.error("Web operation failed:", error);
      if (fallback !== undefined) {
        return typeof fallback === "function" ? (fallback as () => T)() : fallback;
      }
      return undefined;
    }
  } else {
    if (warningMessage) {
      console.warn(warningMessage);
    }
    if (fallback !== undefined) {
      return typeof fallback === "function" ? (fallback as () => T)() : fallback;
    }
    return undefined;
  }
};

/**
 * Safe localStorage operations
 *
 * NOTE: In React Native, do NOT use this for critical auth tokens.
 * The polyfill has memory cache sync issues. Use AsyncStorage directly instead.
 * This is only safe for web environments or non-critical data.
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    // Only use in web environment
    if (isWebEnvironment()) {
      try {
        return (globalThis as any).localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    }

    // React Native: Return null (don't use polyfill for auth tokens)
    console.warn("[PLATFORM-UTILS] localStorage.getItem called in React Native - returning null");
    return null;
  },

  setItem: (key: string, value: string): void => {
    // Only use in web environment
    if (isWebEnvironment()) {
      try {
        (globalThis as any).localStorage.setItem(key, value);
      } catch (error) {
        // Silent fail
      }
    } else {
      console.warn("[PLATFORM-UTILS] localStorage.setItem called in React Native - ignoring");
    }
  },

  removeItem: (key: string): void => {
    // Only use in web environment
    if (isWebEnvironment()) {
      try {
        (globalThis as any).localStorage.removeItem(key);
      } catch (error) {
        // Silent fail
      }
    } else {
      console.warn("[PLATFORM-UTILS] localStorage.removeItem called in React Native - ignoring");
    }
  },

  clear: (): void => {
    // Only use in web environment
    if (isWebEnvironment()) {
      try {
        (globalThis as any).localStorage.clear();
      } catch (error) {
        // Silent fail
      }
    } else {
      console.warn("[PLATFORM-UTILS] localStorage.clear called in React Native - ignoring");
    }
  }
};

/**
 * Safe URL operations
 */
export const safeURL = {
  createObjectURL: (blob: Blob): string | null => {
    return safeWebOperation(
      () => (globalThis as any).URL?.createObjectURL(blob),
      null,
      `URL.createObjectURL is not available in this environment`
    ) ?? null;
  },

  revokeObjectURL: (url: string): void => {
    safeWebOperation(
      () => (globalThis as any).URL?.revokeObjectURL(url),
      undefined,
      `URL.revokeObjectURL is not available in this environment`
    );
  }
};

/**
 * Safe file download operation for web browsers
 */
export const safeFileDownload = (blob: Blob, filename: string): boolean => {
  return safeWebOperation(
    () => {
      const url = (globalThis as any).URL?.createObjectURL(blob);
      if (!url) return false;

      const link = (globalThis as any).document?.createElement("a");
      if (!link) return false;

      link.href = url;
      link.download = filename;
      (globalThis as any).document?.body?.appendChild(link);
      link.click();
      (globalThis as any).document?.body?.removeChild(link);
      (globalThis as any).URL?.revokeObjectURL(url);
      return true;
    },
    false,
    `File download is not supported in this environment (React Native). Use platform-specific download methods.`
  ) ?? false;
};

/**
 * Platform info for debugging
 */
export const getPlatformInfo = () => {
  return {
    isWeb: isWebEnvironment(),
    isReactNative: isReactNativeEnvironment(),
    isNode: isNodeEnvironment(),
    hasWindow: typeof (globalThis as any).window !== "undefined",
    hasDocument: typeof (globalThis as any).document !== "undefined",
    hasLocalStorage: typeof (globalThis as any).localStorage !== "undefined",
    hasURL: typeof (globalThis as any).URL !== "undefined",
    userAgent: typeof (globalThis as any).navigator !== "undefined" ? (globalThis as any).navigator.userAgent : "unknown",
    platform: typeof (globalThis as any).navigator !== "undefined" ? (globalThis as any).navigator.platform : "unknown"
  };
};