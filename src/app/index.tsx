// /app.index.tsx
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, isAuthReady } = useAuth();
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
      router.replace('/(tabs)/inicio' as any);
    } else {
      router.replace('/(autenticacao)/entrar' as any);
    }
  }, [isAuthReady, user, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={isDark ? "#f5f5f5" : "#0a0a0a"} />
    </View>
  );
}
