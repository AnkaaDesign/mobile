// /app.index.tsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { getStoredToken } from "@/utils/storage";

export default function Index() {
  const { user, isAuthReady } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const { clearHistory } = useNavigationHistory();
  const hasRedirected = useRef(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Check for stored token on mount - this is the source of truth for authentication
  useEffect(() => {
    const checkToken = async () => {
      const token = await getStoredToken();
      setHasToken(!!token);
      setTokenChecked(true);
    };
    checkToken();
  }, []);

  useEffect(() => {
    // Only redirect once
    if (hasRedirected.current) return;

    // Wait for token check to complete
    if (!tokenChecked) return;

    // Wait for auth to be initialized
    if (!isAuthReady) return;

    hasRedirected.current = true;

    // Clear navigation history
    clearHistory();

    // Determine redirect based on stored token (source of truth)
    // This prevents redirect to login during ErrorBoundary recovery when user object is temporarily null
    if (hasToken || user) {
      console.log('[INDEX] User authenticated (hasToken:', hasToken, ', user:', !!user, ') - going to home');
      router.replace('/(tabs)/inicio' as any);
    } else {
      console.log('[INDEX] No token and no user - going to login');
      router.replace('/(autenticacao)/entrar' as any);
    }
  }, [tokenChecked, hasToken, isAuthReady, user, router, clearHistory]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={isDark ? "#f5f5f5" : "#0a0a0a"} />
    </View>
  );
}
