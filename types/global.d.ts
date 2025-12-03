/**
 * Global Type Definitions
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window {
    // React Native doesn't have window object - placeholder for compatibility
  }

  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Global {
      // Global extensions - placeholder for future use
    }
  }
}

// Fix for missing User.logged property
declare module "../src/types" {
  interface User {
    logged?: boolean;
  }
}

// CSS module declarations for NativeWind
declare module "*.css";
declare module "../../global.css";

export {};
