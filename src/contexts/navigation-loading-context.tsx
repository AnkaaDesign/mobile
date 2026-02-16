/**
 * Navigation Loading Context
 * Provides a global loading overlay that prevents double-clicks and shows
 * immediate visual feedback during navigation transitions.
 */
import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, BackHandler } from 'react-native';
import { useTheme } from '@/lib/theme';
import { router, usePathname } from 'expo-router';

interface NavigationLoadingContextType {
  /** Ref for synchronous navigation-in-progress checks (no re-renders) */
  isNavigatingRef: React.RefObject<boolean>;
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

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();

  // Single source of truth: overlayVisible drives both visual AND touch blocking
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Ref for synchronous double-click guard (no render delay)
  const isNavigatingRef = useRef(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPathnameRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showOverlay = useCallback(() => {
    // Set ref immediately for synchronous double-click guard
    isNavigatingRef.current = true;
    setOverlayVisible(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const hideOverlay = useCallback(() => {
    // Clear ref immediately
    isNavigatingRef.current = false;
    setOverlayVisible(false);

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Failsafe: force hide if stuck too long
  useEffect(() => {
    if (overlayVisible) {
      const maxVisibleTime = setTimeout(() => {
        console.warn('[NavigationLoading] FAILSAFE: Overlay stuck for too long, forcing hide');
        hideOverlay();
      }, 3000);

      return () => clearTimeout(maxVisibleTime);
    }
  }, [overlayVisible, hideOverlay]);

  // Auto-end navigation when pathname changes (navigation completed)
  useEffect(() => {
    if (pathname && previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;

      // If overlay is visible, hide it — navigation completed
      if (isNavigatingRef.current) {
        hideOverlay();
      }
    }
  }, [pathname, hideOverlay]);

  // Block hardware back button while navigating
  useEffect(() => {
    if (!overlayVisible) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Block back button during navigation
    });

    return () => subscription.remove();
  }, [overlayVisible]);

  const startNavigation = useCallback(() => {
    showOverlay();

    // Safety timeout - always hide after DEFAULT_TIMEOUT
    timeoutRef.current = setTimeout(() => {
      hideOverlay();
    }, DEFAULT_TIMEOUT);
  }, [showOverlay, hideOverlay]);

  const endNavigation = useCallback(() => {
    hideOverlay();
  }, [hideOverlay]);

  const forceReset = useCallback(() => {
    console.warn('[NavigationLoading] FORCE RESET');
    hideOverlay();
  }, [hideOverlay]);

  const navigateWithLoading = useCallback((
    action: () => void,
    options?: { timeout?: number }
  ) => {
    // Use ref for instant synchronous check — no stale closure issues
    if (isNavigatingRef.current) {
      return;
    }

    startNavigation();

    // Defer navigation to next frame so overlay renders before heavy work starts
    requestAnimationFrame(() => {
      try {
        action();
      } catch (error) {
        console.error('[NavigationLoading] Navigation error:', error);
        endNavigation();
      }
    });

    // Set custom timeout if provided
    if (options?.timeout) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        hideOverlay();
      }, options.timeout);
    }
  }, [startNavigation, endNavigation, hideOverlay]);

  const pushWithLoading = useCallback((route: string) => {
    navigateWithLoading(() => {
      router.push(route as any);
    });
  }, [navigateWithLoading]);

  const replaceWithLoading = useCallback((route: string) => {
    navigateWithLoading(() => {
      router.replace(route as any);
    });
  }, [navigateWithLoading]);

  const goBackWithLoading = useCallback((options?: { fallbackRoute?: string }) => {
    navigateWithLoading(() => {
      if (router.canGoBack()) {
        router.back();
      } else if (options?.fallbackRoute) {
        router.replace(options.fallbackRoute as any);
      }
    });
  }, [navigateWithLoading]);

  const goBack = useCallback((options?: { fallbackRoute?: string }) => {
    if (router.canGoBack()) {
      router.back();
    } else if (options?.fallbackRoute) {
      pushWithLoading(options.fallbackRoute);
    }
  }, [pushWithLoading]);

  const contextValue = useMemo(() => ({
    isNavigatingRef,
    startNavigation,
    endNavigation,
    forceReset,
    navigateWithLoading,
    pushWithLoading,
    replaceWithLoading,
    goBackWithLoading,
    goBack,
  }), [
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

      {/* Loading Overlay — conditionally rendered so visibility and
          touch blocking are always in sync (same React commit) */}
      {overlayVisible && (
        <View
          style={[
            styles.overlay,
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)' },
          ]}
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
        </View>
      )}
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
  return context?.isNavigatingRef?.current ?? false;
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
