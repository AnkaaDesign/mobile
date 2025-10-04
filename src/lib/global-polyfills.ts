// Global polyfills for React Native environment
// This file handles environment-specific global objects and APIs

// Import localStorage polyfill
import "./localStorage-polyfill";

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
    // Add any window properties that api-client or other packages might need
    __ANKAA_API_URL__: undefined,
  };
}

// Ensure global performance object exists for React Native
if (typeof global.performance === "undefined") {
  global.performance = {
    now: () => Date.now(),
  } as any;
}

export {};
