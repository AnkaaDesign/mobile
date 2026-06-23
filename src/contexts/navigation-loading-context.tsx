/**
 * Navigation Loading Context
 * Provides a global loading overlay that prevents double-clicks and shows
 * immediate visual feedback during navigation transitions.
 */
import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, BackHandler, AppState, AppStateStatus } from 'react-native';
import { useTheme } from '@/lib/theme';
import { router, usePathname } from 'expo-router';
import { useNavigationHistory } from '@/contexts/navigation-history-context';

interface NavigationLoadingContextType {
  /** Ref for synchronous navigation-in-progress checks (no re-renders) */
  isNavigatingRef: React.RefObject<boolean>;
  /** Start navigation with loading overlay */
  startNavigation: () => void;
  /** End navigation and hide overlay */
  endNavigation: () => void;
  /** Claim overlay — prevents auto-hide on pathname change until endNavigation() is called */
  claimOverlay: () => void;
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
  /**
   * Dismiss to a route with loading overlay. Wraps `router.dismissTo` —
   * pops the stack to the target if present, otherwise replaces.
   */
  dismissToWithLoading: (route: string) => void;
  /** Go back with loading overlay (deprecated - use goBack instead) */
  goBackWithLoading: (options?: { fallbackRoute?: string }) => void;
  /** Go back without loading overlay (instant) */
  goBack: (options?: { fallbackRoute?: string }) => void;
  /**
   * Wrap an async operation (typically a mutation) with the loading overlay.
   * Closes the "no overlay on mutations" gap — overlay shows for the
   * duration of the promise, regardless of success/failure. The promise's
   * resolution / rejection is propagated unchanged.
   */
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType | null>(null);

const DEFAULT_TIMEOUT = 1500; // 1.5 seconds max for any navigation

// Reliable imperative backstops, armed inside showOverlay() — plain setTimeouts
// on the live JS event loop, independent of any React state transition. These
// replace the old state-driven failsafe effect, which re-armed only on an
// overlayVisible false→true transition and was therefore silently defeated when
// React 18 auto-batching collapsed a hide-then-show into a no-op, leaving the
// overlay with NO live timer and recoverable only by a minimize/restore
// (AppState 'active'). showOverlay() is the only way the overlay becomes
// visible, so arming a backstop there guarantees there is ALWAYS a live timer
// that will hide it.
//
// Two ceilings because the primary dismissal differs:
//  - Navigation / wait-for-ready screens dismiss on the destination's ready
//    signal (useScreenReady → endNavigation); the backstop only catches a
//    screen that never signals ready. Short, so a stuck overlay self-heals
//    before a user would reach for the app switcher.
//  - withLoading() mutations dismiss precisely when their promise settles; the
//    backstop only catches a promise that never settles. Long, so it never
//    cuts a legitimately slow operation (e.g. a large file upload) early.
const NAV_WATCHDOG_TIMEOUT = 6000; // 6s backstop for navigation overlays
const MUTATION_WATCHDOG_TIMEOUT = 30000; // 30s backstop for withLoading overlays

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();
  const { goBack: historyGoBack } = useNavigationHistory();

  // Single source of truth: overlayVisible drives both visual AND touch blocking
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Ref for synchronous double-click guard (no render delay)
  const isNavigatingRef = useRef(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Imperative hard-ceiling watchdog, armed on EVERY showOverlay() call.
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPathnameRef = useRef<string | null>(null);
  // Tracks the previous AppState so we only react to background→active.
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // When a screen calls claimOverlay(), auto-hide on pathname change is suppressed.
  // The screen must call endNavigation() explicitly (via useScreenReady(isReady)).
  const overlayClaimedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
      }
    };
  }, []);

  const hideOverlay = useCallback(() => {
    // Clear ref immediately
    isNavigatingRef.current = false;
    overlayClaimedRef.current = false;
    setOverlayVisible(false);

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const showOverlay = useCallback((watchdogMs: number = NAV_WATCHDOG_TIMEOUT) => {
    // Set ref immediately for synchronous double-click guard
    isNavigatingRef.current = true;
    overlayClaimedRef.current = false; // Reset claim for new navigation
    setOverlayVisible(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Arm the imperative hard-ceiling watchdog. This is the single reliable
    // backstop: armed unconditionally on every show, on the live JS event
    // loop, independent of any React state transition. showOverlay() is the
    // ONLY entry point that makes the overlay visible, so this guarantees
    // there is ALWAYS a live timer that will hide it — closing the "zero live
    // timers → permanently stuck" window that previously needed a
    // minimize/restore to recover.
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
    }
    watchdogRef.current = setTimeout(() => {
      console.warn('[NavigationLoading] WATCHDOG: overlay exceeded hard ceiling, forcing hide');
      hideOverlay();
    }, watchdogMs);
  }, [hideOverlay]);

  const claimOverlay = useCallback(() => {
    // Only claim if a navigation is actually in progress.
    // Without this guard, screens calling useScreenReady(false) on mount
    // (when no navigation is happening) would set a stale claim that
    // prevents auto-hide on the NEXT navigation.
    if (isNavigatingRef.current) {
      overlayClaimedRef.current = true;

      // A claiming screen owns dismissal: it calls endNavigation() the instant
      // its data is ready (useScreenReady). Cancel the premature 1.5s
      // navigation timeout so the overlay genuinely WAITS for "ready" and the
      // page is revealed exactly when it has content — instead of being
      // force-hidden mid-load, which left the overlay/skeleton out of sync and
      // made "wait until ready" never actually work for any screen slower than
      // 1.5s. The hard watchdog stays armed as the only backstop.
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, []);

  // NOTE: the old state-driven 3s failsafe effect was removed. It re-armed
  // only on an overlayVisible false→true transition, so React 18 auto-batching
  // (which can collapse a hide-then-show back to the same value) could leave it
  // un-armed — the overlay then had NO live timer and only AppState 'active'
  // (minimize/restore) could clear it. The imperative watchdog armed
  // unconditionally inside showOverlay() is the single, reliable backstop.

  // Auto-end navigation when pathname changes (fallback for already-mounted screens
  // whose useScreenReady() won't re-fire). Skipped if a screen has claimed the overlay
  // via claimOverlay() — those screens manage dismissal via useScreenReady(isReady).
  useEffect(() => {
    if (pathname && previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;

      // If overlay is visible and not claimed by a screen, hide it
      if (isNavigatingRef.current && !overlayClaimedRef.current) {
        hideOverlay();
      }
    }
  }, [pathname, hideOverlay]);

  // Guaranteed recovery on app foreground. A native AppState 'active' event is
  // delivered to JS even when JS timers have been starved (the case where the
  // imperative watchdog above can't fire), so this is the backstop that mirrors
  // the manual minimize/maximize workaround: any overlay still up when the app
  // returns to the foreground is force-hidden. By the time the app is active
  // again, any in-flight transition has long since settled, so clearing the
  // overlay here is always safe.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const wasBackgrounded = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextAppState;
      if (wasBackgrounded && nextAppState === 'active') {
        // Only act if something is actually showing — keep it a no-op otherwise.
        if (isNavigatingRef.current || watchdogRef.current) {
          hideOverlay();
        }
      }
    });
    return () => subscription.remove();
  }, [hideOverlay]);

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
    // Use ref for instant synchronous check — no stale closure issues.
    if (isNavigatingRef.current) {
      return;
    }

    startNavigation();

    // Run the navigation SYNCHRONOUSLY, inside this tap handler. Do NOT defer it
    // to a later tick (requestAnimationFrame OR setTimeout): on RN 0.81 New
    // Architecture, when the app is idle the native run loop / timer display-link
    // pauses, so a queued rAF/timer callback — and the router.push inside it — is
    // stranded until a native event (a push notification, or app
    // background→foreground) wakes the JS thread. The destination then never
    // mounts, nothing fetches, nothing wakes the thread, and the overlay sticks.
    // The tap itself is a native event being processed right now, so the JS
    // thread is awake here: doing the push synchronously makes the navigation
    // state update + React commit happen inside this guaranteed-to-flush cycle.
    // React 19 batches the overlay-show with the navigation, so the destination's
    // skeleton renders together with the overlay on top — no idle-freeze window.
    try {
      action();
    } catch (error) {
      console.error('[NavigationLoading] Navigation error:', error);
      endNavigation();
    }

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

  const dismissToWithLoading = useCallback((route: string) => {
    navigateWithLoading(() => {
      const r: any = router;
      if (typeof r.dismissTo === "function") {
        r.dismissTo(route);
      } else {
        r.replace(route);
      }
    });
  }, [navigateWithLoading]);

  const goBackWithLoading = useCallback((options?: { fallbackRoute?: string }) => {
    navigateWithLoading(() => {
      historyGoBack(options);
    });
  }, [navigateWithLoading, historyGoBack]);

  const goBack = useCallback((options?: { fallbackRoute?: string }) => {
    historyGoBack(options);
  }, [historyGoBack]);

  /**
   * Run an async operation with the overlay visible for its duration.
   * Resolves / rejects with the underlying promise's outcome.
   *
   * The overlay is unconditionally hidden in the finally block — error
   * handling is the caller's responsibility (see useFormFlow).
   */
  const withLoading = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    showOverlay(MUTATION_WATCHDOG_TIMEOUT);
    // Long-running mutations may exceed DEFAULT_TIMEOUT; clear that timer.
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    return fn().finally(() => {
      hideOverlay();
    });
  }, [showOverlay, hideOverlay]);

  const contextValue = useMemo(() => ({
    isNavigatingRef,
    startNavigation,
    endNavigation,
    claimOverlay,
    forceReset,
    navigateWithLoading,
    pushWithLoading,
    replaceWithLoading,
    dismissToWithLoading,
    goBackWithLoading,
    goBack,
    withLoading,
  }), [
    startNavigation,
    endNavigation,
    claimOverlay,
    forceReset,
    navigateWithLoading,
    pushWithLoading,
    replaceWithLoading,
    dismissToWithLoading,
    goBackWithLoading,
    goBack,
    withLoading,
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

/**
 * @deprecated Use `useNav` from `@/contexts/nav` for new code. This hook
 * is kept temporarily so existing callers keep working during migration;
 * it will be removed in the Phase 3 cleanup pass.
 */
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
