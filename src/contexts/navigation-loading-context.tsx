/**
 * Navigation Loading Context
 * Provides a global loading overlay that prevents double-clicks and shows
 * immediate visual feedback during navigation transitions.
 */
import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Animated, BackHandler } from 'react-native';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { router, usePathname } from 'expo-router';

interface NavigationLoadingContextType {
  /** Whether navigation is in progress */
  isNavigating: boolean;
  /** Start navigation with loading overlay */
  startNavigation: (message?: string) => void;
  /** End navigation and hide overlay */
  endNavigation: () => void;
  /** Navigate with automatic loading state management */
  navigateWithLoading: (
    action: () => void,
    options?: { message?: string; timeout?: number }
  ) => void;
  /** Push route with loading overlay */
  pushWithLoading: (route: string, options?: { message?: string }) => void;
  /** Replace route with loading overlay */
  replaceWithLoading: (route: string, options?: { message?: string }) => void;
  /** Go back with loading overlay */
  goBackWithLoading: (options?: { message?: string; fallbackRoute?: string }) => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType | null>(null);

const DEFAULT_TIMEOUT = 8000; // Max time to show loading overlay
const MIN_DISPLAY_TIME = 100; // Minimum time to show overlay for perceived feedback

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const previousPathnameRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-end navigation when pathname changes (navigation completed)
  useEffect(() => {
    if (pathname && previousPathnameRef.current !== pathname) {
      // Pathname changed - navigation completed
      if (isNavigating && previousPathnameRef.current !== null) {
        // Small delay to ensure smooth transition
        const hideTimer = setTimeout(() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          // Ensure minimum display time for perceived feedback
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              setIsNavigating(false);
              setMessage(null);
            });
          }, remaining);
        }, 50);

        return () => clearTimeout(hideTimer);
      }
      previousPathnameRef.current = pathname;
    }
  }, [pathname, isNavigating, fadeAnim]);

  // Block back button while navigating
  useEffect(() => {
    if (!isNavigating) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // Block back button during navigation
      return true;
    });

    return () => subscription.remove();
  }, [isNavigating]);

  const showOverlay = useCallback((msg?: string) => {
    setMessage(msg || null);
    setIsNavigating(true);
    startTimeRef.current = Date.now();
    // Instant show - no animation delay
    fadeAnim.setValue(1);
  }, [fadeAnim]);

  const hideOverlay = useCallback(() => {
    // Ensure minimum display time for perceived feedback
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setIsNavigating(false);
        setMessage(null);
      });
    }, remaining);
  }, [fadeAnim]);

  const startNavigation = useCallback((msg?: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    showOverlay(msg);

    // Safety timeout to prevent stuck overlay
    timeoutRef.current = setTimeout(() => {
      hideOverlay();
    }, DEFAULT_TIMEOUT);
  }, [showOverlay, hideOverlay]);

  const endNavigation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    hideOverlay();
  }, [hideOverlay]);

  const navigateWithLoading = useCallback((
    action: () => void,
    options?: { message?: string; timeout?: number }
  ) => {
    // Prevent double navigation
    if (isNavigating) return;

    startNavigation(options?.message);

    // Execute the navigation action
    try {
      action();
    } catch (error) {
      console.error('[NavigationLoading] Navigation error:', error);
      endNavigation();
    }

    // Set custom timeout if provided
    if (options?.timeout && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        hideOverlay();
      }, options.timeout);
    }
  }, [isNavigating, startNavigation, endNavigation, hideOverlay]);

  const pushWithLoading = useCallback((route: string, options?: { message?: string }) => {
    navigateWithLoading(() => {
      router.push(route as any);
    }, options);
  }, [navigateWithLoading]);

  const replaceWithLoading = useCallback((route: string, options?: { message?: string }) => {
    navigateWithLoading(() => {
      router.replace(route as any);
    }, options);
  }, [navigateWithLoading]);

  const goBackWithLoading = useCallback((options?: { message?: string; fallbackRoute?: string }) => {
    navigateWithLoading(() => {
      if (router.canGoBack()) {
        router.back();
      } else if (options?.fallbackRoute) {
        router.replace(options.fallbackRoute as any);
      }
    }, options);
  }, [navigateWithLoading]);

  const contextValue = useMemo(() => ({
    isNavigating,
    startNavigation,
    endNavigation,
    navigateWithLoading,
    pushWithLoading,
    replaceWithLoading,
    goBackWithLoading,
  }), [
    isNavigating,
    startNavigation,
    endNavigation,
    navigateWithLoading,
    pushWithLoading,
    replaceWithLoading,
    goBackWithLoading,
  ]);

  return (
    <NavigationLoadingContext.Provider value={contextValue}>
      {children}

      {/* Global Loading Overlay */}
      {isNavigating && (
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
            },
          ]}
          pointerEvents="auto"
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
              {message && (
                <ThemedText
                  style={styles.message}
                  variant="muted"
                >
                  {message}
                </ThemedText>
              )}
            </View>
          </Pressable>
        </Animated.View>
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
    minWidth: 120,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});
