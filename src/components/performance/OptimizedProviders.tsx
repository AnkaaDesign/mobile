import React, { lazy, Suspense, memo, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/auth-context";
import { NetworkProvider } from "@/contexts/network-context";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useTheme } from "@/lib/theme";

// Lazy load non-critical providers
const SidebarProvider = lazy(() => import("@/contexts/sidebar-context").then(m => ({ default: m.SidebarProvider })));
const SwipeRowProvider = lazy(() => import("@/contexts/swipe-row-context").then(m => ({ default: m.SwipeRowProvider })));
const NavigationHistoryProvider = lazy(() => import("@/contexts/navigation-history-context").then(m => ({ default: m.NavigationHistoryProvider })));
const NavigationLoadingProvider = lazy(() => import("@/contexts/navigation-loading-context").then(m => ({ default: m.NavigationLoadingProvider })));
const FavoritesProvider = lazy(() => import("@/contexts/favorites-context").then(m => ({ default: m.FavoritesProvider })));
const FileViewerProvider = lazy(() => import("@/components/file").then(m => ({ default: m.FileViewerProvider })));
const PushNotificationsProvider = lazy(() => import("@/contexts/push-notifications-context-wrapper").then(m => ({ default: m.PushNotificationsProvider })));

// Loading fallback component
const LoadingFallback = memo(() => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
});

LoadingFallback.displayName = 'LoadingFallback';

// Optimized provider wrapper
interface OptimizedProvidersProps {
  children: React.ReactNode;
}

export const OptimizedProviders = memo(({ children }: OptimizedProvidersProps) => {
  // Memoize style to prevent recreation
  const gestureHandlerStyle = useMemo(() => ({ flex: 1 }), []);

  return (
    <GestureHandlerRootView style={gestureHandlerStyle}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NetworkProvider>
            <AuthProvider>
              <ThemeProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <NavigationLoadingProvider>
                    <NavigationHistoryProvider>
                      <SidebarProvider>
                        <SwipeRowProvider>
                          <FavoritesProvider>
                            <FileViewerProvider>
                              <PushNotificationsProvider>
                                {children}
                              </PushNotificationsProvider>
                            </FileViewerProvider>
                          </FavoritesProvider>
                        </SwipeRowProvider>
                      </SidebarProvider>
                    </NavigationHistoryProvider>
                  </NavigationLoadingProvider>
                </Suspense>
              </ThemeProvider>
            </AuthProvider>
          </NetworkProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});

OptimizedProviders.displayName = 'OptimizedProviders';

// Critical providers that must load immediately
export const CriticalProviders = memo(({ children }: OptimizedProvidersProps) => {
  const gestureHandlerStyle = useMemo(() => ({ flex: 1 }), []);

  return (
    <GestureHandlerRootView style={gestureHandlerStyle}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NetworkProvider>
            <AuthProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </AuthProvider>
          </NetworkProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});

CriticalProviders.displayName = 'CriticalProviders';