// Import localStorage polyfill first
import "@/lib/localStorage-polyfill";
// Import type definitions
import "@/types";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SwipeRowProvider } from "@/contexts/swipe-row-context";
import { NavigationHistoryProvider } from "@/contexts/navigation-history-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { FileViewerProvider } from "@/components/file";
import { ErrorBoundary } from "@/components/error-boundary";
import { PortalHost } from "@rn-primitives/portal";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { AppStatusBar } from "@/components/app-status-bar";
import NetInfo from "@react-native-community/netinfo";
import { updateApiUrl } from '../api-client';
import { setupMobileNotifications } from "@/lib/setup-notifications";
import "global.css";

// Initialize API URL early - this is critical for mobile
if (process.env.EXPO_PUBLIC_API_URL) {
  console.log("[App] Setting API URL:", process.env.EXPO_PUBLIC_API_URL);
  updateApiUrl(process.env.EXPO_PUBLIC_API_URL);
}

// Setup mobile notifications for API responses
setupMobileNotifications();

// Create a client outside the component to prevent recreation on renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 24 hours
      gcTime: 1000 * 60 * 60 * 24,
      // Refetch when the app regains connectivity
      refetchOnReconnect: true,
      refetchOnWindowFocus: false, // Disable for mobile
      // Retry failed queries, but don't retry if they failed due to being offline
      retry: (failureCount, error: any) => {
        if (error?.isOffline) return false;
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.isOffline) return false;
        // Never retry mutations on client errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Only retry network errors once for mutations
        return failureCount < 1;
      },
      retryDelay: 2000, // 2 second delay for mutation retries
    },
  },
});
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
export default function RootLayout() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  // Initialize network state and listen for changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(!!state.isConnected);
    });
    // Check initial connection state
    NetInfo.fetch().then((state) => {
      setIsConnected(!!state.isConnected);
    });
    // Simulate hydration completion
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 500);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Show loading state while hydrating, but render the full component tree
  // to avoid breaking hooks in child components
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <FavoritesProvider>
                  <FileViewerProvider baseUrl={process.env.EXPO_PUBLIC_API_URL}>
                    <NavigationHistoryProvider>
                      <SwipeRowProvider>
                      <AppStatusBar />
                      {!isHydrated ? (
                      // Show loading screen during hydration
                      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" className="text-primary" />
                        <Text>Carregando dados...</Text>
                      </View>
                    ) : (
                      // Show app content after hydration
                      <>
                        {isConnected === false && (
                          <View
                            style={{
                              backgroundColor: "#fef2f2",
                              padding: 10,
                              alignItems: "center",
                            }}
                          >
                            <Text className="text-red-800">Você está offline. Alguns recursos podem não estar disponíveis.</Text>
                          </View>
                        )}
                        <Stack
                          screenOptions={{
                            headerShown: false,
                          }}
                        >
                          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                          <Stack.Screen name="index" options={{ headerShown: false }} />
                        </Stack>
                        <PortalHost />
                      </>
                    )}
                      </SwipeRowProvider>
                    </NavigationHistoryProvider>
                  </FileViewerProvider>
                </FavoritesProvider>
              </AuthProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
