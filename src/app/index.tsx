// /app.index.tsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { View, ActivityIndicator } from "react-native";
import { useNav } from "@/contexts/nav";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { mobileRoute } from "@/constants/routes.types";
import { routes } from "@/constants/routes";
import { authRoute } from "@/components/auth/auth-routes";
import { getStoredToken } from "@/utils/storage";

/**
 * Root index — boot redirect. Decides between home (when a token is present
 * or a user is in context) and the login screen. Uses typed routes via
 * `mobileRoute` / `authRoute`.
 *
 * `useNavigationHistory().clearHistory` is the only piece that can't go
 * through `useNav` (the consolidated hook doesn't expose history mutators).
 */
export default function Index() {
  const { user, isAuthReady } = useAuth();
  const { isDark } = useTheme();
  const nav = useNav();
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
      nav.replace(mobileRoute(routes.home));
    } else {
      console.log('[INDEX] No token and no user - going to login');
      nav.replace(authRoute(routes.authentication.login));
    }
  }, [tokenChecked, hasToken, isAuthReady, user, nav, clearHistory]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={isDark ? "#f5f5f5" : "#0a0a0a"} />
    </View>
  );
}
