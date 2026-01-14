// Import global polyfills first (includes localStorage and window object)
import "@/lib/global-polyfills";
// Import type definitions
import "@/types";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/auth-context";
import { NetworkProvider, useNetwork } from "@/contexts/network-context";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { SwipeRowProvider } from "@/contexts/swipe-row-context";
import { NavigationHistoryProvider } from "@/contexts/navigation-history-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { FileViewerProvider } from "@/components/file";
import { ErrorBoundary } from "@/components/error-boundary";
import { PortalHost } from "@rn-primitives/portal";
import { PushNotificationsProvider } from "@/contexts/push-notifications-context-wrapper";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, LogBox } from "react-native";
import { AppStatusBar } from "@/components/app-status-bar";
import { DeepLinkHandler } from "@/components/deep-link-handler";
import { AuthAwareMessageModal } from "@/components/message/MessageModalIntegration";
// Toast system removed - API client uses native Alert/ToastAndroid via setup-notifications.ts
import Constants from "expo-constants";
import { updateApiUrl } from '../api-client';
import { setupMobileNotifications } from "@/lib/setup-notifications";
import "../../global.css";

// =====================================================
// Global Error Handling Setup
// =====================================================

// Store for tracking if we're handling an error (prevent cascading)
let isHandlingError = false;

// Set up global error handler to prevent red screen crashes from logging out users
const setupGlobalErrorHandler = () => {
  // Get the original error handler
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Prevent re-entrant error handling
    if (isHandlingError) {
      return;
    }
    isHandlingError = true;

    console.error('[Global Error Handler]', isFatal ? 'FATAL:' : 'ERROR:', error?.message || error);

    // For non-fatal errors, just log them - don't show red screen
    if (!isFatal) {
      console.warn('[Global Error Handler] Non-fatal error caught, suppressing red screen');
      isHandlingError = false;
      return;
    }

    // For fatal errors in development, show the red screen for debugging
    // In production, we could show a custom error screen instead
    if (__DEV__) {
      // Still show the error in dev, but with a delay to let ErrorBoundary try first
      setTimeout(() => {
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
        isHandlingError = false;
      }, 100);
    } else {
      // In production, just log the error
      console.error('[Global Error Handler] Fatal error in production:', error);
      isHandlingError = false;
    }
  });
};

// Configure LogBox to be less intrusive
if (__DEV__) {
  // Ignore specific warnings that are noisy but not critical
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'Sending `onAnimatedValueUpdate` with no listeners registered',
    'VirtualizedLists should never be nested',
    // Add common React Native warnings that aren't actual problems
    'Each child in a list should have a unique "key" prop',
  ]);
}

// Initialize the global error handler
setupGlobalErrorHandler();

// Set initial API URL - NetworkProvider will handle dynamic switching based on connectivity
// Priority: app.json > environment variable > default
const apiUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
const fallbackApiUrl = Constants.expoConfig?.extra?.fallbackApiUrl || process.env.EXPO_PUBLIC_FALLBACK_API_URL;

if (apiUrl) {
  console.log("[App] Primary API URL:", apiUrl);
  console.log("[App] Fallback API URL:", fallbackApiUrl || 'not configured');
  // Set initial URL - NetworkProvider will update this dynamically based on connectivity
  updateApiUrl(apiUrl);
} else {
  console.error("[App] No API URL configured! App will not work correctly.");
}

// Setup mobile notifications for API responses
setupMobileNotifications();

// Create a persister for AsyncStorage
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "react-query-cache",
});

// Only setup persistence in production to avoid auth issues during development
if (process.env.NODE_ENV === "production") {
  persistQueryClient({
    queryClient,
    persister: asyncStoragePersister,
    // Cache for up to 7 days
    maxAge: 1000 * 60 * 60 * 24 * 7,
    // Dehydrate/hydrate the cache on certain events
    hydrateOptions: {
      // Don't stop the app if there's an error during hydration
      defaultOptions: {
        queries: {
          structuralSharing: true,
        },
      },
    },
    // Exclude auth queries from persistence to avoid stale auth state
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        // Don't persist auth-related queries
        const queryKey = query.queryKey[0];
        if (typeof queryKey === 'string' && (queryKey.includes('auth') || queryKey.includes('users'))) {
          return false;
        }
        return true;
      },
    },
  });
} else {
  // In development, clear any existing persisted cache on start
  console.log("[Dev] Clearing persisted React Query cache to avoid auth issues");
  AsyncStorage.removeItem("react-query-cache").catch(() => {});
}
/**
 * Offline Banner Component
 * Uses NetworkContext to display connectivity status
 */
function OfflineBanner() {
  const { isConnected, isUsingOfflineUrl, currentBaseUrl } = useNetwork();

  // Don't show banner when connected to internet
  if (isConnected) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: isUsingOfflineUrl ? "#fef3c7" : "#fef2f2",
        padding: 10,
        alignItems: "center",
      }}
    >
      <Text className={isUsingOfflineUrl ? "text-amber-800" : "text-red-800"}>
        {isUsingOfflineUrl
          ? "Usando servidor local (rede interna)"
          : "Voce esta offline. Alguns recursos podem nao estar disponiveis."}
      </Text>
    </View>
  );
}

/**
 * App Content Component
 * Separated to allow use of NetworkContext hooks
 * This component is inside NetworkProvider, so it can use useNetwork()
 */
function AppContent() {
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const { currentBaseUrl } = useNetwork();

  // Mark hydration complete quickly - no artificial delay needed
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isHydrated) {
    // Show loading screen during hydration
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" className="text-primary" />
        <Text>Carregando dados...</Text>
      </View>
    );
  }

  // Show app content after hydration
  // FileViewerProvider uses currentBaseUrl which updates dynamically based on connectivity
  return (
    <FileViewerProvider baseUrl={currentBaseUrl}>
      <AppStatusBar />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(autenticacao)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <PortalHost />
      {/* System Messages Modal - shows unviewed messages on app load and focus */}
      <AuthAwareMessageModal />
    </FileViewerProvider>
  );
}

export default function RootLayout() {
  // Handle connectivity changes for logging
  const handleConnectivityChange = (isConnected: boolean) => {
    if (__DEV__) {
      console.log("[RootLayout] Connectivity changed:", isConnected ? "ONLINE" : "OFFLINE");
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NetworkProvider onConnectivityChange={handleConnectivityChange}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <PushNotificationsProvider>
                  <DeepLinkHandler />
                  <ErrorBoundary>
                    <SidebarProvider>
                      <FavoritesProvider>
                        <NavigationHistoryProvider>
                          <SwipeRowProvider>
                            {/* FileViewerProvider moved to AppContent to use dynamic currentBaseUrl from NetworkContext */}
                            <AppContent />
                          </SwipeRowProvider>
                        </NavigationHistoryProvider>
                      </FavoritesProvider>
                    </SidebarProvider>
                  </ErrorBoundary>
                </PushNotificationsProvider>
              </AuthProvider>
            </QueryClientProvider>
          </NetworkProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
