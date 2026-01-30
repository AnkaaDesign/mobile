import { createContext, useEffect, useState, useContext, ReactNode, useCallback, useRef, useMemo } from "react";
import { authService, setAuthToken, setTokenProvider, setAuthErrorHandler, removeAuthErrorHandler, cancelAllRequests, setIsLoggingOut } from '../api-client';
import { authStorage, storeToken, getStoredToken, removeStoredToken, storeUserData, getUserData, removeUserData } from "@/utils/auth-storage";
import { useRouter } from "expo-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Alert, View, Text, AppState, AppStateStatus, Platform } from "react-native";
import NetInfo from '@react-native-community/netinfo';
import { detectContactMethod } from '../utils';
import { jwtDecode } from "jwt-decode";

// Error types for distinguishing auth errors from network errors
const enum AuthErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Classify an error to determine if we should logout or use cached data
 */
function classifyAuthError(error: any): AuthErrorType {
  // Network errors - don't logout, use cached data
  if (!error) return AuthErrorType.UNKNOWN;

  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.statusCode || error.response?.status;

  // Network connectivity issues
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnaborted') ||
    message.includes('connection') ||
    message.includes('offline') ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK' ||
    error.isOffline
  ) {
    return AuthErrorType.NETWORK_ERROR;
  }

  // Explicit auth failures - should logout
  if (status === 401) {
    return AuthErrorType.TOKEN_INVALID;
  }

  // Server errors - don't logout, might be temporary
  if (status >= 500) {
    return AuthErrorType.SERVER_ERROR;
  }

  return AuthErrorType.UNKNOWN;
}

import type { SignUpFormData, PasswordResetRequestFormData, VerifyCodeFormData, SendVerificationFormData } from '../schemas';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
  refreshUserData: () => Promise<void>;
  isAuthReady: boolean;
  register: (data: { name: string; contact: string; password: string }) => Promise<{ requiresVerification: boolean; phone?: string; email?: string; userId?: string }>;
  recoverPassword: (data: PasswordResetRequestFormData) => Promise<void>;
  verifyCode: ReturnType<typeof useMutation<any, Error, VerifyCodeFormData>>;
  resendVerification: ReturnType<typeof useMutation<any, Error, SendVerificationFormData>>;
  // Offline mode support
  isOffline: boolean;
  lastValidatedAt: number | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  details: () => [...USER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const,
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [cachedToken, setCachedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isValidatingSession, setIsValidatingSession] = useState<boolean>(false);
  const [isFetchingUser, setIsFetchingUser] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [lastValidatedAt, setLastValidatedAt] = useState<number | null>(null);
  const isFetchingUserRef = useRef<boolean>(false);
  const lastValidationTime = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const hasCompletedInitialAuth = useRef<boolean>(false);
  const wasOfflineRef = useRef<boolean>(false);

  // Set up the token provider for the API client
  useEffect(() => {
    const tokenProvider = () => cachedToken;
    setTokenProvider(tokenProvider);
  }, [cachedToken]);

  // Sync cached token with AsyncStorage whenever user changes
  useEffect(() => {
    const syncToken = async () => {
      const token = await getStoredToken();
      setCachedToken(token);
    };
    syncToken();
  }, [user]);

  // Set up global authentication error handler
  useEffect(() => {
    const handleAuthError = async (error: { statusCode: number; message: string; category: any }) => {
      if (error.statusCode === 401) {
        setIsLoggingOut(true);
        cancelAllRequests();

        // Batch state updates first (synchronous)
        setUser(null);
        setAccessToken(null);
        setCachedToken(null);
        setAuthToken(null);

        // Perform cleanup in background (non-blocking)
        Promise.all([
          removeStoredToken(),
          removeUserData(),
        ]).catch(() => {});

        if (queryClient) {
          try {
            // Cancel only user-related queries, not all queries
            queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.all });
            // Remove user queries from cache
            queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });
            // Clear auth-sensitive queries but preserve non-sensitive cached data
            // This prevents unnecessary refetches when the user logs back in
            queryClient.invalidateQueries({ queryKey: ['navigation'] });
            queryClient.invalidateQueries({ queryKey: ['privileges'] });
          } catch {}
        }

        // AsyncStorage cleanup in background
        import('@react-native-async-storage/async-storage')
          .then(m => m.default.removeItem("react-query-cache"))
          .catch(() => {});

        // Reset logging out flag after a short delay to allow guards to handle navigation
        // Navigation is handled by PrivilegeGuard when user becomes null
        setTimeout(() => {
          setIsLoggingOut(false);
        }, 100);
      }
    };

    setAuthErrorHandler(handleAuthError);
    return () => removeAuthErrorHandler();
  }, [router, queryClient]);

  const decodeToken = (token: string) => {
    if (!token || typeof token !== "string" || token.trim() === "") return null;
    try {
      return jwtDecode<{ sub: string; exp: number }>(token);
    } catch {
      return null;
    }
  };

  const apiLogin = async (contact: string, password: string) => {
    return await authService.login({ contact, password });
  };

  const fetchAndUpdateUserData = useCallback(async (token: string, forceRefresh = false): Promise<User | null | 'SKIP'> => {
    if (isFetchingUserRef.current && !forceRefresh) return 'SKIP';

    isFetchingUserRef.current = true;
    setIsFetchingUser(true);

    try {
      if (!token || typeof token !== "string" || token.trim() === "") return null;

      const decodedToken = decodeToken(token);
      if (!decodedToken) return null;

      const response = await authService.me();
      const data = response.data;

      if ((data as any).logged === false) return null;

      const oldPrivileges = user?.sector?.privileges;
      const newPrivileges = data.sector?.privileges;

      // Only invalidate privilege-sensitive queries when privileges actually change
      // This is a targeted invalidation instead of clearing the entire cache
      // which was causing massive performance issues on navigation
      if (oldPrivileges !== newPrivileges && queryClient) {
        try {
          // Cancel any in-flight queries that might depend on old privileges
          await queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.all });

          // Invalidate user-related queries that depend on privileges
          // These will be refetched on next access
          queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });

          // Invalidate navigation/menu related queries if they exist
          queryClient.invalidateQueries({ queryKey: ['navigation'] });
          queryClient.invalidateQueries({ queryKey: ['privileges'] });

          // Note: We intentionally do NOT clear the entire cache anymore
          // Other data (customers, items, etc.) doesn't depend on user privileges
          // and clearing it caused unnecessary refetches and navigation lag
        } catch {}
      }

      setUser(data);
      await storeUserData(data);

      try {
        if (queryClient) {
          queryClient.setQueryData(USER_QUERY_KEYS.detail(decodedToken.sub), { data });
        }
      } catch {}

      return data;
    } catch (apiError: unknown) {
      const error = apiError as { statusCode?: number; message?: string; status?: number; code?: string; isOffline?: boolean };
      const errorType = classifyAuthError(error);

      console.log('[Auth] fetchAndUpdateUserData error:', errorType, error?.statusCode || error?.status);

      // Handle rate limiting
      if (error?.statusCode === 429) {
        console.log('[Auth] Rate limited, will retry in 30 seconds');
        setTimeout(() => {
          if (!user && token) fetchAndUpdateUserData(token, true);
        }, 30000);
        // Use cached data while rate limited
        const cachedUser = await getUserData();
        if (cachedUser && (cachedUser as any).logged !== false) {
          setUser(cachedUser);
          return cachedUser;
        }
        return null;
      }

      // CRITICAL FIX: Only logout on explicit 401 (token invalid/expired on server)
      // Do NOT logout on network errors, timeouts, or server errors
      if (errorType === AuthErrorType.TOKEN_INVALID) {
        console.log('[Auth] Token invalid (401), clearing session');
        try {
          await authStorage.clearAuthData();
          setAccessToken(null);
          setCachedToken(null);
          setUser(null);
          setAuthToken(null);
        } catch {}
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      // For network errors, server errors, or unknown errors:
      // Use cached user data instead of logging out
      // This prevents unexpected logouts when network is flaky
      if (errorType === AuthErrorType.NETWORK_ERROR || errorType === AuthErrorType.SERVER_ERROR) {
        console.log('[Auth] Network/server error, using cached user data');
      }

      const cachedUser = await getUserData();
      if (cachedUser && (cachedUser as any).logged !== false) {
        console.log('[Auth] Using cached user data');
        setUser(cachedUser);
        // Update last validated timestamp even with cached data
        await authStorage.updateLastValidated();
        return cachedUser;
      }

      // No cached data available and couldn't fetch - but don't clear token
      // User might still be able to make requests if network recovers
      console.log('[Auth] No cached user data available');
      return null;
    } finally {
      isFetchingUserRef.current = false;
      setIsFetchingUser(false);
    }
  }, [user, queryClient]);

  const validateSession = useCallback(async () => {
    const now = Date.now();
    // Debounce validation calls (1 second minimum between calls)
    if (now - lastValidationTime.current < 1000) {
      if (!isAuthReady) {
        setLoading(false);
        setIsAuthReady(true);
      }
      return;
    }
    lastValidationTime.current = now;
    setIsValidatingSession(true);

    console.log('[Auth] Starting session validation...');

    try {
      // First, check if we have a stored token
      const authData = await authStorage.getAuthData();

      if (!authData.success || !authData.data?.token) {
        // No token stored - user is not logged in (this is expected)
        console.log('[Auth] No stored token, user not logged in');
        setUser(null);
        setAccessToken(null);
        setCachedToken(null);
        setAuthToken(null);
        return;
      }

      const { token, user: cachedUser, metadata } = authData.data;

      // Validate token format
      const decodedToken = decodeToken(token);
      if (!decodedToken) {
        console.log('[Auth] Token failed to decode, clearing auth');
        await authStorage.clearAuthData();
        setAccessToken(null);
        setCachedToken(null);
        setUser(null);
        setAuthToken(null);
        return;
      }

      // Set token in state immediately - user is authenticated from storage
      setAuthToken(token);
      setAccessToken(token);
      setCachedToken(token);

      // If we have cached user data, use it immediately for fast startup
      if (cachedUser) {
        console.log('[Auth] Using cached user data for fast startup');
        setUser(cachedUser);
      }

      // Check network connectivity before trying to validate with server
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable !== false;

      if (!isConnected) {
        // Offline - use cached data, don't try to validate with server
        console.log('[Auth] Device is offline, using cached data');
        setIsOffline(true);
        if (cachedUser) {
          // Already set above, just log
          console.log('[Auth] Session restored from cache (offline mode)');
          // Use metadata's last validated time if available
          if (metadata?.lastValidated) {
            setLastValidatedAt(metadata.lastValidated);
          }
        } else {
          // No cached user but have token - keep token, let requests try when online
          console.log('[Auth] No cached user but have token, will validate when online');
        }
        return;
      }

      // Online - mark as connected
      setIsOffline(false);

      // Online - try to validate with server (with timeout)
      console.log('[Auth] Device is online, validating with server...');

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Session validation timeout')), 20000); // 20 second timeout
      });

      try {
        const userData = await Promise.race([
          fetchAndUpdateUserData(token),
          timeoutPromise,
        ]);

        if (userData === 'SKIP') {
          console.log('[Auth] Validation skipped (already in progress)');
          return;
        }

        if (userData) {
          console.log('[Auth] Session validated successfully with server');
          await authStorage.updateLastValidated();
          setLastValidatedAt(Date.now());
        } else {
          // fetchAndUpdateUserData returned null - could be network issue
          // but it already handled using cached data internally
          // DO NOT clear auth data here - user might still be logged in
          console.log('[Auth] Server validation returned null, keeping cached session');
        }
      } catch (validationError: any) {
        // Timeout or network error during validation
        const errorType = classifyAuthError(validationError);
        console.log('[Auth] Validation error:', errorType, validationError?.message);

        // CRITICAL FIX: Only logout on explicit 401, NOT on timeout/network errors
        if (errorType === AuthErrorType.TOKEN_INVALID) {
          console.log('[Auth] Token invalid, clearing session');
          await authStorage.clearAuthData();
          setAccessToken(null);
          setCachedToken(null);
          setUser(null);
          setAuthToken(null);
        } else {
          // Network error, timeout, server error - keep user logged in with cached data
          console.log('[Auth] Keeping session despite error (cached user available)');
          // User state already set from cached data above
        }
      }
    } catch (error) {
      // Critical error in validation itself (not network/auth error)
      console.error("[Auth] Critical session validation error:", error);
      // Even here, try to use cached data instead of logging out
      const cachedUser = await getUserData();
      if (cachedUser && (cachedUser as any).logged !== false) {
        console.log('[Auth] Using cached user after critical error');
        setUser(cachedUser);
      }
      // Only clear if we have no cached data AND no token
      const token = await getStoredToken();
      if (!token && !cachedUser) {
        setUser(null);
        setAccessToken(null);
        setCachedToken(null);
        setAuthToken(null);
      }
    } finally {
      setLoading(false);
      setIsAuthReady(true);
      setIsValidatingSession(false);
      hasCompletedInitialAuth.current = true;
    }
  }, [fetchAndUpdateUserData, isAuthReady, decodeToken]);

  // Initial mount effect
  useEffect(() => {
    const timeoutId = setTimeout(() => validateSession(), 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Handle app state changes - validate session when coming back to foreground
  // FIXED: Added validateSession to dependencies to avoid stale closure
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // Only validate when coming FROM background TO active
      if (previousState.match(/inactive|background/) && nextAppState === "active") {
        console.log('[Auth] App resumed from background, validating session');
        // Delay slightly to let the app fully resume
        setTimeout(() => validateSession(), 200);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [validateSession]); // FIXED: Now properly includes validateSession

  // Handle network connectivity changes - revalidate when coming back online
  // This ensures user stays logged in even after extended offline periods
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;

      setIsOffline(!isConnected);

      // If we just came back online and have a user, validate the session
      if (isConnected && wasOfflineRef.current && user && accessToken) {
        console.log('[Auth] Device came back online, validating session in background');
        // Delay to let network stabilize
        setTimeout(() => {
          fetchAndUpdateUserData(accessToken, true)
            .then(() => {
              console.log('[Auth] Session validated after coming online');
              setLastValidatedAt(Date.now());
            })
            .catch(() => {
              // Don't logout on error - network might still be flaky
              console.log('[Auth] Background validation failed, keeping cached session');
            });
        }, 2000);
      }

      wasOfflineRef.current = !isConnected;
    });

    return () => unsubscribe();
  }, [user, accessToken, fetchAndUpdateUserData]);

  // Periodic refresh (5 minutes)
  useEffect(() => {
    if (!user || !accessToken) return;

    const refreshInterval = setInterval(() => {
      if (AppState.currentState === "active") {
        fetchAndUpdateUserData(accessToken, true).catch(() => {});
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user, accessToken, fetchAndUpdateUserData]);

  useEffect(() => {
    if (accessToken) {
      setAuthToken(accessToken);
      setCachedToken(accessToken);
      storeToken(accessToken).catch(() => {});
    } else {
      setAuthToken(null);
      setCachedToken(null);
      if (hasCompletedInitialAuth.current) {
        removeStoredToken().catch(() => {});
      }
    }
  }, [accessToken]);

  const login = async (contact: string, password: string) => {
    try {
      setLoading(true);

      const response = await apiLogin(contact, password);

      const access_token = response.data.token;
      const userData = response.data.user;

      if (!access_token || typeof access_token !== "string") {
        throw new Error("Token inválido recebido do servidor");
      }

      const decodedToken = decodeToken(access_token);
      if (!decodedToken) {
        throw new Error("Não foi possível decodificar o token de autenticação");
      }

      if ((userData as any).logged === false) {
        throw new Error("Você não está autorizado a entrar no sistema, contate um administrador");
      }

      if (!userData.verified) {
        throw new Error("VERIFICATION_REDIRECT");
      }

      setAuthToken(access_token);
      await storeToken(access_token);
      setAccessToken(access_token);
      setCachedToken(access_token);

      try {
        const completeUserData = await fetchAndUpdateUserData(access_token);
        if (completeUserData === 'SKIP' || !completeUserData) {
          setUser(userData as User);
          await storeUserData(userData);
        }
      } catch {
        setUser(userData as User);
        await storeUserData(userData);
      }

      try {
        if (queryClient) {
          queryClient.setQueryData(USER_QUERY_KEYS.detail(decodedToken.sub), { data: userData });
        }
      } catch {}
    } catch (error: any) {
      await removeStoredToken();
      setAccessToken(null);
      setCachedToken(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; contact: string; password: string }) => {
    const contactType = detectContactMethod(data.contact);
    const isEmail = contactType === "email";
    const transformedData: SignUpFormData = {
      name: data.name,
      password: data.password,
      ...(isEmail ? { email: data.contact } : { phone: data.contact }),
    };

    const response = await authService.register(transformedData);

    if (response.data?.token && response.data?.user) {
      const { token, user } = response.data;

      if (user.verified === false) {
        return {
          requiresVerification: true,
          ...(contactType === "phone" ? { phone: data.contact } : { email: data.contact }),
          userId: user.id,
        };
      }

      await storeToken(token);
      await storeUserData(user);
      setAuthToken(token);
      setAccessToken(token);
      setCachedToken(token);
      setUser(user as User);

      return { requiresVerification: false };
    }

    return {
      requiresVerification: true,
      ...(contactType === "phone" ? { phone: data.contact } : { email: data.contact }),
    };
  };

  const logout = async (showAlert = false, alertMessage = "") => {
    console.log('[Auth] Logout initiated');
    setIsLoggingOut(true);
    cancelAllRequests();

    // Batch state updates first (synchronous)
    setUser(null);
    setAccessToken(null);
    setCachedToken(null);
    setAuthToken(null);
    setLoading(false);

    // Show alert if needed
    if (showAlert && alertMessage) {
      Alert.alert("Acesso Bloqueado", alertMessage);
    }

    // CRITICAL: Actually await storage cleanup to ensure it completes
    // This prevents the "logged out on app restart" issue where storage
    // cleanup didn't complete before the app closed
    try {
      await authStorage.clearAuthData();
      console.log('[Auth] Auth storage cleared');
    } catch (error) {
      console.error('[Auth] Error clearing auth storage:', error);
    }

    // React Query cleanup
    if (queryClient) {
      try {
        queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.all });
        queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });
        queryClient.invalidateQueries({ queryKey: ['navigation'] });
        queryClient.invalidateQueries({ queryKey: ['privileges'] });
      } catch {}
    }

    // Clear React Query cache from AsyncStorage
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem("react-query-cache");
    } catch {}

    // Reset logging out flag after a short delay
    setTimeout(() => {
      setIsLoggingOut(false);
    }, 100);

    console.log('[Auth] Logout complete');
  };

  const refreshUserData = async () => {
    if (accessToken) {
      const updatedUser = await fetchAndUpdateUserData(accessToken, true);
      if (updatedUser === 'SKIP') {
        Alert.alert("Informação", "Atualização em andamento");
        return null;
      }
      if (updatedUser) {
        Alert.alert("Sucesso", "Dados atualizados com sucesso");
        return updatedUser;
      } else {
        Alert.alert("Erro", "Erro ao atualizar dados");
        return null;
      }
    }
    return null;
  };

  const recoverPassword = async (data: PasswordResetRequestFormData) => {
    await authService.requestPasswordReset(data);
  };

  const verifyCodeMutation = useMutation({
    mutationFn: (data: VerifyCodeFormData) => authService.verifyCode(data),
    onSuccess: () => refreshUserData(),
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (data: SendVerificationFormData) => authService.resendVerification(data),
  });

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading: loading,
    login,
    logout,
    accessToken,
    refreshUserData,
    isAuthReady,
    register,
    recoverPassword,
    verifyCode: verifyCodeMutation,
    resendVerification: resendVerificationMutation,
    // Offline mode support
    isOffline,
    lastValidatedAt,
  }), [user, loading, accessToken, isAuthReady, verifyCodeMutation, resendVerificationMutation, isOffline, lastValidatedAt]);

  if (!isAuthReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>Verificando autenticação...</Text>
      </View>
    );
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
