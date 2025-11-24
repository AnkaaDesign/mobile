// Global polyfills for React Native environment
// This file handles environment-specific global objects and APIs

// Import localStorage polyfill
import "./localStorage-polyfill";
import { initializeMemoryStorage } from "./localStorage-polyfill";
import { Platform } from "react-native";

// Initialize memory storage early (but don't await - let it run in background)
// This happens after the polyfill is installed but before the app starts
// Only run on actual native platforms (iOS/Android), not during web bundling
if (Platform.OS === "ios" || Platform.OS === "android") {
  // Use setTimeout to ensure this runs after module loading is complete
  setTimeout(() => {
    initializeMemoryStorage().catch((error) => {
      console.warn("[GLOBAL POLYFILLS] Failed to initialize memory storage:", error);
    });
  }, 0);
}

// React Native doesn't have window object, but some packages expect it
// Create a minimal window polyfill for packages that check for its existence
if (typeof window === "undefined") {
  (global as any).window = {
    // Minimal window object properties that packages might check for
    navigator: {
      userAgent: "ReactNative",
    },
    location: {
      hostname: "localhost",
      protocol: "http:",
      origin: "http://localhost",
    },
    // Note: __ANKAA_API_URL__ will be set by updateApiUrl() - don't initialize here
  };
}

// Ensure global performance object exists for React Native
if (typeof global.performance === "undefined") {
  global.performance = {
    now: () => Date.now(),
  } as any;
}

export {};
