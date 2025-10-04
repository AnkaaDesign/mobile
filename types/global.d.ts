/**
 * Global Type Definitions
 */

declare global {
  interface Window {
    // React Native doesn't have window object
  }

  namespace NodeJS {
    interface Global {
      // Global extensions
    }
  }
}

// Fix for missing User.logged property
declare module "../src/types" {
  interface User {
    logged?: boolean;
  }
}

export {};
