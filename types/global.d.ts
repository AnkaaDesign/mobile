/**
 * Global Type Definitions
 */

// Storage interface for cross-platform localStorage compatibility
interface Storage {
  readonly length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
  [name: string]: unknown;
}

// Performance API interface (available in React Native runtime)
interface Performance {
  now(): number;
}

// PerformanceObserver interface (may not be available in all environments)
interface PerformanceObserverEntryList {
  getEntries(): PerformanceEntry[];
}

interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
}

interface PerformanceObserverInit {
  entryTypes?: string[];
}

declare class PerformanceObserver {
  constructor(callback: (list: PerformanceObserverEntryList) => void);
  observe(options: PerformanceObserverInit): void;
  disconnect(): void;
}

declare global {
  // Performance API - available in React Native JavaScript runtime
  const performance: Performance;

  // localStorage polyfill - provided by src/lib/localStorage-polyfill.ts
  var localStorage: Storage;

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window {
    // localStorage for web builds (Expo web) - undefined in React Native
    localStorage?: Storage;
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
