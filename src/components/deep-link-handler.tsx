import { useEffect, useRef } from 'react';
import { Linking, AppState, AppStateStatus, Alert } from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { handleDeepLink, processPendingDeepLink } from '@/lib/deep-linking';

// DEBUG: Flag to enable/disable debug alerts for testing
const DEBUG_DEEP_LINKING = true;

/**
 * DeepLinkHandler component
 *
 * This component handles deep linking throughout the app lifecycle:
 * - Handles app opened from a deep link (cold start)
 * - Handles deep links while app is running (warm start)
 * - Processes pending deep links after user authenticates
 * - Monitors app state changes to handle background->foreground transitions
 *
 * Must be rendered inside AuthProvider to access authentication state
 */
export function DeepLinkHandler() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const hasProcessedInitialLink = useRef(false);
  const lastProcessedUrl = useRef<string | null>(null);
  const appState = useRef(AppState.currentState);

  // Handle initial URL (cold start - app opened from link)
  useEffect(() => {
    if (!isAuthReady) {
      console.log('[Deep Link Handler] Waiting for auth to be ready');
      return;
    }

    // Only process once when auth is ready
    if (hasProcessedInitialLink.current) {
      return;
    }

    const handleInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL();

        if (url) {
          console.log('[Deep Link Handler] Initial URL detected (cold start):', url);
          if (DEBUG_DEEP_LINKING) {
            Alert.alert(
              '🔗 Deep Link - Cold Start',
              `URL: ${url}\nAuth: ${isAuthenticated ? 'Yes' : 'No'}`,
              [{ text: 'OK' }]
            );
          }
          lastProcessedUrl.current = url;
          await handleDeepLink(url, isAuthenticated);
          hasProcessedInitialLink.current = true;
        } else {
          console.log('[Deep Link Handler] No initial URL, checking for pending deep link');
          // Check if there's a pending deep link from previous session
          await processPendingDeepLink(isAuthenticated);
          hasProcessedInitialLink.current = true;
        }
      } catch (error) {
        console.error('[Deep Link Handler] Error handling initial URL:', error);
        if (DEBUG_DEEP_LINKING) {
          Alert.alert('❌ Deep Link Error', `Initial URL error: ${error}`);
        }
      }
    };

    handleInitialURL();
  }, [isAuthenticated, isAuthReady]);

  // Handle URL events while app is running (warm start)
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    const handleURLEvent = ({ url }: { url: string }) => {
      console.log('[Deep Link Handler] URL event received (warm start):', url);

      if (DEBUG_DEEP_LINKING) {
        Alert.alert(
          '🔗 Deep Link - Warm Start',
          `URL: ${url}\nAuth: ${isAuthenticated ? 'Yes' : 'No'}`,
          [{ text: 'OK' }]
        );
      }

      // Avoid processing the same URL twice in quick succession
      if (lastProcessedUrl.current === url) {
        console.log('[Deep Link Handler] Skipping duplicate URL');
        return;
      }

      lastProcessedUrl.current = url;
      handleDeepLink(url, isAuthenticated);
    };

    const subscription = Linking.addEventListener('url', handleURLEvent);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isAuthReady]);

  // Handle authentication state changes (e.g., user just logged in)
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    // When user becomes authenticated, check for pending deep links
    if (isAuthenticated) {
      console.log('[Deep Link Handler] User authenticated, processing pending deep link');
      processPendingDeepLink(true);
    }
  }, [isAuthenticated, isAuthReady]);

  // Handle app state changes (background <-> foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // App coming to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[Deep Link Handler] App came to foreground');

        // Check for pending deep links when app returns to foreground
        if (isAuthReady && isAuthenticated) {
          processPendingDeepLink(true);
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isAuthReady]);

  // This component doesn't render anything
  return null;
}
