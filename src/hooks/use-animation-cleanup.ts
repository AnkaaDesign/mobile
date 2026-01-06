/**
 * Custom hook for managing animation lifecycle and preventing memory leaks
 * Provides automatic cleanup for Reanimated values and animations
 */

import { useEffect, useRef, useCallback } from "react";
import { SharedValue, cancelAnimation, makeMutable } from "react-native-reanimated";

interface AnimationConfig {
  name: string;
  value: SharedValue<number>;
  autoCleanup?: boolean;
}

interface UseAnimationCleanupReturn {
  registerAnimation: (config: AnimationConfig) => void;
  unregisterAnimation: (name: string) => void;
  cleanupAnimation: (name: string) => void;
  cleanupAllAnimations: () => void;
  isAnimationRegistered: (name: string) => boolean;
}

export const useAnimationCleanup = (): UseAnimationCleanupReturn => {
  const animationsRef = useRef<Map<string, AnimationConfig>>(new Map());
  const cleanupTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /**
   * Register an animation for tracking and automatic cleanup
   */
  const registerAnimation = useCallback((config: AnimationConfig) => {
    const { name, autoCleanup = true } = config;

    // Cancel any existing animation with the same name
    if (animationsRef.current.has(name)) {
      cleanupAnimation(name);
    }

    animationsRef.current.set(name, config);

    // Only log in development if explicitly enabled
    if (__DEV__ && process.env.LOG_ANIMATIONS === "true") {
      console.log(`🎬 Animation registered: ${name}`);
    }

    // Set up automatic cleanup if enabled
    if (autoCleanup) {
      // Clear any existing cleanup timer
      const existingTimer = cleanupTimersRef.current.get(name);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set up new cleanup timer (cleanup after 30 seconds of inactivity)
      const timer = setTimeout(() => {
        if (animationsRef.current.has(name)) {
          cleanupAnimation(name);
        }
      }, 30000);

      cleanupTimersRef.current.set(name, timer);
    }
  }, []);

  /**
   * Unregister an animation without cleanup
   */
  const unregisterAnimation = useCallback((name: string) => {
    animationsRef.current.delete(name);

    // Clear cleanup timer
    const timer = cleanupTimersRef.current.get(name);
    if (timer) {
      clearTimeout(timer);
      cleanupTimersRef.current.delete(name);
    }

    // Only log in development if explicitly enabled
    if (__DEV__ && process.env.LOG_ANIMATIONS === "true") {
      console.log(`🗑️ Animation unregistered: ${name}`);
    }
  }, []);

  /**
   * Clean up a specific animation
   */
  const cleanupAnimation = useCallback(
    (name: string) => {
      const animation = animationsRef.current.get(name);

      if (animation) {
        try {
          // Cancel any running animation
          cancelAnimation(animation.value);

          // Reset value to initial state
          animation.value.value = 0;

          // Only log in development if explicitly enabled
          if (__DEV__ && process.env.LOG_ANIMATIONS === "true") {
            console.log(`🧹 Animation cleaned up: ${name}`);
          }
        } catch (error) {
          if (__DEV__) {
            console.warn(`⚠️ Error cleaning up animation ${name}:`, error);
          }
        }
      }

      unregisterAnimation(name);
    },
    [unregisterAnimation],
  );

  /**
   * Clean up all registered animations
   */
  const cleanupAllAnimations = useCallback(() => {
    const animationNames = Array.from(animationsRef.current.keys());

    animationNames.forEach((name) => {
      cleanupAnimation(name);
    });

    // Only log in development if explicitly enabled
    if (__DEV__ && process.env.LOG_ANIMATIONS === "true" && animationNames.length > 0) {
      console.log(`🧹 Cleaned up ${animationNames.length} animations`);
    }
  }, [cleanupAnimation]);

  /**
   * Check if an animation is registered
   */
  const isAnimationRegistered = useCallback((name: string): boolean => {
    return animationsRef.current.has(name);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllAnimations();
    };
  }, [cleanupAllAnimations]);

  return {
    registerAnimation,
    unregisterAnimation,
    cleanupAnimation,
    cleanupAllAnimations,
    isAnimationRegistered,
  };
};

/**
 * Hook for managing a single animation with automatic cleanup
 */
export const useAnimationWithCleanup = (
  name: string,
  initialValue: number = 0,
  autoCleanup: boolean = true,
): {
  animatedValue: SharedValue<number>;
  cleanup: () => void;
} => {
  const animatedValue = useRef(makeMutable(initialValue)).current;
  const { registerAnimation, cleanupAnimation } = useAnimationCleanup();
  const isRegistered = useRef(false);

  useEffect(() => {
    // Only register once
    if (!isRegistered.current) {
      registerAnimation({
        name,
        value: animatedValue,
        autoCleanup,
      });
      isRegistered.current = true;
    }

    return () => {
      if (isRegistered.current) {
        cleanupAnimation(name);
        isRegistered.current = false;
      }
    };
  }, []); // Remove dependencies to prevent re-registration

  const cleanup = useCallback(() => {
    if (isRegistered.current) {
      cleanupAnimation(name);
      isRegistered.current = false;
    }
  }, [name, cleanupAnimation]);

  return {
    animatedValue,
    cleanup,
  };
};

/**
 * Hook for preventing memory leaks in component lifecycle
 */
export const useMemoryLeakPrevention = (componentName?: string) => {
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const intervalsRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
  const listenersRef = useRef<Map<string, () => void>>(new Map());

  const addTimeout = useCallback((timeout: ReturnType<typeof setTimeout>) => {
    timeoutsRef.current.add(timeout);
    return timeout;
  }, []);

  const addInterval = useCallback((interval: ReturnType<typeof setInterval>) => {
    intervalsRef.current.add(interval);
    return interval;
  }, []);

  const addListener = useCallback((key: string, cleanup: () => void) => {
    // Remove existing listener with same key
    const existingCleanup = listenersRef.current.get(key);
    if (existingCleanup) {
      existingCleanup();
    }

    listenersRef.current.set(key, cleanup);
  }, []);

  const removeListener = useCallback((key: string) => {
    const cleanup = listenersRef.current.get(key);
    if (cleanup) {
      cleanup();
      listenersRef.current.delete(key);
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    // Clear timeouts
    timeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    timeoutsRef.current.clear();

    // Clear intervals
    intervalsRef.current.forEach((interval) => {
      clearInterval(interval);
    });
    intervalsRef.current.clear();

    if (__DEV__ && (timeoutsRef.current.size > 0 || intervalsRef.current.size > 0)) {
      console.log(`🧹 Cleared timers for ${componentName || "component"}`);
    }
  }, [componentName]);

  const clearAllListeners = useCallback(() => {
    listenersRef.current.forEach((cleanup) => {
      cleanup();
    });
    listenersRef.current.clear();

    if (__DEV__ && listenersRef.current.size > 0) {
      console.log(`🧹 Cleared listeners for ${componentName || "component"}`);
    }
  }, [componentName]);

  const clearAll = useCallback(() => {
    clearAllTimers();
    clearAllListeners();
  }, [clearAllTimers, clearAllListeners]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return {
    addTimeout,
    addInterval,
    addListener,
    removeListener,
    clearAllTimers,
    clearAllListeners,
    clearAll,
  };
};

export default useAnimationCleanup;
