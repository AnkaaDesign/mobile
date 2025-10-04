// /app.index.tsx
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../constants';

export default function Index() {
  const { user, isLoading, isAuthReady } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once on initial app load
    if (hasRedirected.current) return;

    // Wait for auth to be fully initialized
    if (!isAuthReady) return;

    console.log('[INDEX] Initial redirect - User:', user ? 'authenticated' : 'not authenticated');

    hasRedirected.current = true;

    if (user) {
      router.replace(routeToMobilePath(routes.home) as any);
    } else {
      router.replace(routeToMobilePath(routes.authentication.login) as any);
    }
  }, [isAuthReady, user, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={isDark ? "#f5f5f5" : "#0a0a0a"} />
    </View>
  );
}
