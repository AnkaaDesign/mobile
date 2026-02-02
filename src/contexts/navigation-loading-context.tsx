/**
 * Navigation Loading Context
 * Provides a global loading overlay that prevents double-clicks and shows
 * immediate visual feedback during navigation transitions.
 */
import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Animated, BackHandler } from 'react-native';
import { useTheme } from '@/lib/theme';
import { router, usePathname } from 'expo-router';

interface NavigationLoadingContextType {
  /** Whether navigation is in progress */
  isNavigating: boolean;
  /** Start navigation with loading overlay */
  startNavigation: () => void;
  /** End navigation and hide overlay */
  endNavigation: () => void;
  /** Force reset all navigation state (emergency use only) */
  forceReset: () => void;
  /** Navigate with automatic loading state management */
  navigateWithLoading: (
    action: () => void,
    options?: { timeout?: number }
  ) => void;
  /** Push route with loading overlay */
  pushWithLoading: (route: string) => void;
  /** Replace route with loading overlay */
  replaceWithLoading: (route: string) => void;
  /** Go back with loading overlay (deprecated - use goBack instead) */
  goBackWithLoading: (options?: { fallbackRoute?: string }) => void;
  /** Go back without loading overlay (instant) */
  goBack: (options?: { fallbackRoute?: string }) => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType | null>(null);

const DEFAULT_TIMEOUT = 1500; // 1.5 seconds max for any navigation
const MIN_DISPLAY_TIME = 0; // No artificial delay for instant feedback

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const previousPathnameRef = useRef<string | null>(null);
  const isHidingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Failsafe: Monitor overlay state and force hide if stuck
  useEffect(() => {
    if (overlayVisible) {
      // Set a maximum time any overlay can be visible
      const maxVisibleTime = setTimeout(() => {
        console.warn('[NavigationLoading] FAILSAFE: Overlay stuck for too long, forcing hide');
        hideOverlay();
      }, 3000); // 3 seconds max

      return () => clearTimeout(maxVisibleTime);
    }
  }, [overlayVisible, hideOverlay]);

  // Additional failsafe: Check for state mismatch
  useEffect(() => {
    // If isNavigating is true but overlay is not visible, clear it
    if (isNavigating && !overlayVisible) {
      console.warn('[NavigationLoading] State mismatch detected: isNavigating=true but overlay not visible');
      setIsNavigating(false);
    }
  }, [isNavigating, overlayVisible]);

  // Auto-end navigation when pathname changes (navigation completed)
  useEffect(() => {
    if (pathname && previousPathnameRef.current !== pathname) {
      console.log('[NavigationLoading] Pathname changed:', {
        from: previousPathnameRef.current,
        to: pathname,
        overlayVisible
      });

      previousPathnameRef.current = pathname;

      // If overlay is visible, hide it immediately
      if (overlayVisible || isNavigating) {
        console.log('[NavigationLoading] Auto-hiding overlay due to pathname change');
        hideOverlay();
      }
    }
  }, [pathname, overlayVisible, isNavigating, hideOverlay]);

  // Block back button while navigating
  useEffect(() => {
    if (!isNavigating) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // Block back button during navigation
      return true;
    });

    return () => subscription.remove();
  }, [isNavigating]);

  const showOverlay = useCallback(() => {
    console.log('[NavigationLoading] showOverlay called');

    // Clear any existing timeouts
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Stop any existing animations and show immediately
    fadeAnim.stopAnimation();
    fadeAnim.setValue(1);

    setIsNavigating(true);
    setOverlayVisible(true);
    isHidingRef.current = false;
    startTimeRef.current = Date.now();
  }, [fadeAnim]);

  const hideOverlay = useCallback(() => {
    console.log('[NavigationLoading] hideOverlay called - forcing immediate hide');

    // FIRST: Immediately clear navigation state to unblock UI
    setIsNavigating(false);
    setOverlayVisible(false);
    isHidingRef.current = false;

    // Clear any pending timeouts
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Stop any existing animations and reset fade
    fadeAnim.stopAnimation();
    fadeAnim.setValue(0);

    console.log('[NavigationLoading] State cleared - UI should be interactive');
  }, [fadeAnim]);

  const startNavigation = useCallback(() => {
    console.log('[NavigationLoading] startNavigation called');

    showOverlay();

    // Aggressive safety timeout - always hide after timeout
    timeoutRef.current = setTimeout(() => {
      console.log('[NavigationLoading] Safety timeout - forcing hide');
      hideOverlay();
    }, DEFAULT_TIMEOUT);
  }, [showOverlay, hideOverlay]);

  const endNavigation = useCallback(() => {
    console.log('[NavigationLoading] endNavigation called - forcing immediate end');

    // Immediately clear the navigation state
    setIsNavigating(false);

    // Then hide the overlay
    hideOverlay();
  }, [hideOverlay]);

  // Emergency reset function
  const forceReset = useCallback(() => {
    console.warn('[NavigationLoading] FORCE RESET - clearing all state');

    // Clear all timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    // Stop animations
    fadeAnim.stopAnimation();
    fadeAnim.setValue(0);

    // Clear all state
    setIsNavigating(false);
    setOverlayVisible(false);
    isHidingRef.current = false;

    console.log('[NavigationLoading] Force reset complete');
  }, [fadeAnim]);

  const navigateWithLoading = useCallback((
    action: () => void,
    options?: { timeout?: number }
  ) => {
    console.log('[NavigationLoading] navigateWithLoading called:', {
      timeout: options?.timeout,
      isNavigating,
      currentPathname: pathname
    });

    // Prevent double navigation
    if (isNavigating) {
      console.log('[NavigationLoading] Navigation already in progress, skipping');
      return;
    }

    startNavigation();

    // Execute the navigation action
    try {
      console.log('[NavigationLoading] Executing navigation action');
      action();
    } catch (error) {
      console.error('[NavigationLoading] Navigation error:', error);
      endNavigation();
    }

    // Set custom timeout if provided
    if (options?.timeout && timeoutRef.current) {
      console.log('[NavigationLoading] Setting custom timeout:', options.timeout);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        console.log('[NavigationLoading] Custom timeout triggered');
        hideOverlay();
      }, options.timeout);
    }
  }, [isNavigating, startNavigation, endNavigation, hideOverlay, pathname]);

  const pushWithLoading = useCallback((route: string) => {
    console.log('[NavigationLoading] pushWithLoading:', { route });
    navigateWithLoading(() => {
      router.push(route as any);
    });
  }, [navigateWithLoading]);

  const replaceWithLoading = useCallback((route: string) => {
    console.log('[NavigationLoading] replaceWithLoading:', { route });
    navigateWithLoading(() => {
      router.replace(route as any);
    });
  }, [navigateWithLoading]);

  const goBackWithLoading = useCallback((options?: { fallbackRoute?: string }) => {
    console.log('[NavigationLoading] goBackWithLoading (deprecated):', {
      canGoBack: router.canGoBack(),
      fallbackRoute: options?.fallbackRoute
    });
    navigateWithLoading(() => {
      if (router.canGoBack()) {
        console.log('[NavigationLoading] Executing router.back()');
        router.back();
      } else if (options?.fallbackRoute) {
        console.log('[NavigationLoading] Using fallback route:', options.fallbackRoute);
        router.replace(options.fallbackRoute as any);
      }
    });
  }, [navigateWithLoading]);

  // New instant back navigation without loading overlay
  const goBack = useCallback((options?: { fallbackRoute?: string }) => {
    console.log('[NavigationLoading] goBack (instant):', {
      canGoBack: router.canGoBack(),
      fallbackRoute: options?.fallbackRoute
    });

    if (router.canGoBack()) {
      console.log('[NavigationLoading] Executing instant router.back()');
      router.back();
    } else if (options?.fallbackRoute) {
      console.log('[NavigationLoading] Using fallback route:', options.fallbackRoute);
      // Use pushWithLoading for fallback since it's navigating to a new page
      pushWithLoading(options.fallbackRoute);
    }
  }, [pushWithLoading]);

  const contextValue = useMemo(() => {
    // Debug log when context value changes
    console.log('[NavigationLoading] Context value update:', {
      isNavigating,
      overlayVisible,
      timestamp: new Date().toISOString()
    });

    return {
      isNavigating,
      startNavigation,
      endNavigation,
      forceReset,
      navigateWithLoading,
      pushWithLoading,
      replaceWithLoading,
      goBackWithLoading,
      goBack,
    };
  }, [
    isNavigating,
    startNavigation,
    endNavigation,
    forceReset,
    navigateWithLoading,
    pushWithLoading,
    replaceWithLoading,
    goBackWithLoading,
    goBack,
  ]);

  return (
    <NavigationLoadingContext.Provider value={contextValue}>
      {children}

      {/* Global Loading Overlay - Always mounted for instant display */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
          },
        ]}
        pointerEvents={overlayVisible ? "auto" : "none"}
      >
        <Pressable
          style={styles.touchBlocker}
          onPress={() => {/* Block all touches */}}
        >
          <View style={[
            styles.loadingContainer,
            { backgroundColor: isDark ? colors.card : colors.background }
          ]}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
          </View>
        </Pressable>
      </Animated.View>
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error('useNavigationLoading must be used within NavigationLoadingProvider');
  }
  return context;
}

// Optional: Hook for components that just need to check loading state
export function useIsNavigating() {
  const context = useContext(NavigationLoadingContext);
  return context?.isNavigating ?? false;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchBlocker: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 80,
    minHeight: 80,
  },
});
