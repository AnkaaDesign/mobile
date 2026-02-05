import { LogBox, InteractionManager, Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { enableFreeze } from 'react-native-screens';

/**
 * Configure React Native for maximum performance
 */
export function configurePerformance() {
  // Enable native screens for better performance
  enableScreens(true);

  // Enable screen freezing to prevent rendering of inactive screens
  enableFreeze(true);

  // Disable yellow box warnings in production
  if (!__DEV__) {
    LogBox.ignoreAllLogs();
  }

  // Configure interaction manager for smoother animations
  if (Platform.OS === 'android') {
    // Android specific optimizations
    InteractionManager.setDeadline(100); // Reduce deadline for better responsiveness
  }

  // Reduce bridge traffic by batching native calls
  if ((global as any).nativeCallSyncHook) {
    const originalCallSyncHook = (global as any).nativeCallSyncHook;
    let batchedCalls: any[] = [];
    let batchTimeout: ReturnType<typeof setTimeout> | null = null;

    (global as any).nativeCallSyncHook = (...args: any[]) => {
      batchedCalls.push(args);

      if (!batchTimeout) {
        batchTimeout = setTimeout(() => {
          const calls = [...batchedCalls];
          batchedCalls = [];
          batchTimeout = null;

          calls.forEach(callArgs => {
            originalCallSyncHook.apply(global, callArgs);
          });
        }, 0);
      }
    };
  }

  // Configure memory management
  if (Platform.OS === 'android') {
    // Request large heap on Android
    if ((global as any).nativeModules?.UIManager) {
      (global as any).nativeModules.UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }

  // Set up performance observer (browser/web only - not available in React Native)
  if (__DEV__ && typeof performance !== 'undefined' && typeof (globalThis as any).PerformanceObserver !== 'undefined') {
    // Monitor long tasks
    try {
      const Observer = (globalThis as any).PerformanceObserver;
      const observer = new Observer((list: { getEntries: () => Array<{ name: string; duration: number }> }) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.name} took ${entry.duration}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });
    } catch (e) {
      // PerformanceObserver might not be available
    }
  }
}

/**
 * Configure React for better performance
 */
export function configureReact() {
  if (__DEV__) {
    // In dev, warn about slow renders
    const slowRenderThreshold = 16; // 1 frame at 60fps

    // Monkey patch console.warn to catch React warnings about slow renders
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('took') && message.includes('ms')) {
        const ms = parseInt(message.match(/(\d+)ms/)?.[1] || '0');
        if (ms > slowRenderThreshold) {
          console.error(`⚠️ SLOW RENDER: ${message}`);
        }
      }
      originalWarn.apply(console, args);
    };
  }

  // Optimize React reconciliation
  if ((global as any).React) {
    const React = (global as any).React;

    // Set concurrent features
    if (React.startTransition) {
      // Use startTransition for non-urgent updates
      (global as any).__USE_REACT_CONCURRENT_FEATURES = true;
    }
  }
}

/**
 * Memory optimization utilities
 */
export const MemoryOptimizer = {
  // Clean up unused memory
  cleanup: () => {
    const globalObj = global as unknown as typeof globalThis & { gc?: () => void };
    if (globalObj.gc) {
      globalObj.gc();
    }
  },

  // Monitor memory usage
  monitor: () => {
    if (__DEV__ && (global as any).performance?.memory) {
      const memory = (global as any).performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);

      if (usedMB > totalMB * 0.8) {
        console.warn(`⚠️ High memory usage: ${usedMB}MB / ${totalMB}MB`);
      }
    }
  },

  // Schedule cleanup
  scheduleCleanup: () => {
    setInterval(() => {
      MemoryOptimizer.cleanup();
      MemoryOptimizer.monitor();
    }, 60000); // Every minute
  }
};

/**
 * Bundle optimization settings
 */
export const BundleOptimizations = {
  // Enable RAM bundle format for faster startup
  enableRAMBundle: true,

  // Inline requires for faster module loading
  inlineRequires: true,

  // Lazy load heavy modules
  lazyModules: [
    'react-native-pdf',
    'react-native-html-to-pdf',
    'firebase',
    'react-native-reanimated'
  ],

  // Preload critical modules
  preloadModules: [
    'react',
    'react-native',
    '@react-navigation/native',
    'expo-router'
  ]
};

/**
 * Initialize all performance optimizations
 */
export function initializePerformanceOptimizations() {
  configurePerformance();
  configureReact();

  if (__DEV__) {
    MemoryOptimizer.scheduleCleanup();
  }
}