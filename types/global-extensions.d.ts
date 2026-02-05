/**
 * Global Type Extensions for React Native
 * Extends Node.js global types with properties used in React Native
 */

declare global {
  interface NodeJS {
    // Extend NodeJS global interface
  }

  // Extend global object with React Native-specific properties
  var performance: Performance | { now: () => number };
  var gc: (() => void) | undefined;
  var expo: any;
}

// Extend Performance interface with optional memory property
interface Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export {};
