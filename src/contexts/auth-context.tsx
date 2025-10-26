import React, { createContext, useEffect, useState, useContext, ReactNode, useCallback, useRef } from "react";
import { authService, setAuthToken, setTokenProvider, setAuthErrorHandler, removeAuthErrorHandler } from '../api-client';
import { storeToken, getStoredToken, removeStoredToken, storeUserData, getUserData, removeUserData } from "@/lib/storage";
import { useRouter } from "expo-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Alert, View, Text, AppState, AppStateStatus } from "react-native";
import { detectContactMethod } from '../utils';
import { jwtDecode } from "jwt-decode";
import { routes } from '../constants';
import type { SignUpFormData, PasswordResetRequestFormData, VerifyCodeFormData, SendVerificationFormData } from '../schemas';
import type { User } from '../types';
import { routeToMobilePath } from "@/lib/route-mapper";

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
}

interface AuthProviderProps {
  children: ReactNode;
}

// Add new keys for user queries
export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  details: () => [...USER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const,
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  console.log("[AUTH DEBUG] AuthProvider component rendering");

  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [cachedToken, setCachedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isValidatingSession, setIsValidatingSession] = useState<boolean>(false);
  const [isFetchingUser, setIsFetchingUser] = useState<boolean>(false);
  const isFetchingUserRef = useRef<boolean>(false);
  const lastValidationTime = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  console.log("[AUTH DEBUG] Initial state:", {
    user: user ? `${user.name} (${user.id})` : "null",
    accessToken: accessToken ? "exists" : "null",
    loading,
    isAuthReady,
    isValidatingSession,
    isFetchingUser,
  });

  // Set up the token provider for the API client to use cached token
  useEffect(() => {
    console.log("[AUTH DEBUG] Setting up token provider");
    // Create a synchronous token provider that returns cached token
    const tokenProvider = () => {
      console.log("[AUTH DEBUG] Token provider called - returning cached token:", cachedToken ? `Token exists (length: ${cachedToken.length})` : "No token");
      return cachedToken;
    };

    setTokenProvider(tokenProvider);
    console.log("[AUTH DEBUG] Token provider setup complete");
  }, [cachedToken]);

  // Sync cached token with AsyncStorage whenever user changes
  useEffect(() => {
    const syncToken = async () => {
      console.log("[AUTH DEBUG] Syncing token from AsyncStorage to cache");
      const token = await getStoredToken();
      console.log("[AUTH DEBUG] Token sync result:", token ? `Token exists (length: ${token.length})` : "No token");
      setCachedToken(token);
    };
    syncToken();
  }, [user]);

  // Set up global authentication error handler
  useEffect(() => {
    console.log("[AUTH DEBUG] Setting up authentication error handler");

    const handleAuthError = async (error: { statusCode: number; message: string; category: any }) => {
      console.log("[MOBILE AUTH DEBUG] Authentication error detected:", error);

      // Check if it's a deleted user or token-related error
      if (error.statusCode === 401 || error.statusCode === 403) {
        console.log("[MOBILE AUTH DEBUG] Triggering logout due to authentication error");

        try {
          // Clear auth state immediately
          setUser(null);
          setAccessToken(null);
          setCachedToken(null);
          await removeStoredToken();
          await removeUserData();
          setAuthToken(null);

          // Clear React Query cache
          if (queryClient) {
            queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });
            queryClient.clear();
          }

          // Clear persisted React Query cache
          try {
            const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
            await AsyncStorage.removeItem("react-query-cache");
            console.log("[AUTH DEBUG] Cleared persisted cache during auth error");
          } catch (storageError) {
            console.warn("Failed to clear persisted cache during auth error:", storageError);
          }

          // Navigate to login page
          setTimeout(() => {
            try {
              router.replace(routeToMobilePath(routes.authentication.login) as any);
            } catch (navError) {
              console.error("Navigation error during auth error logout:", navError);
            }
          }, 100);
        } catch (cleanupError) {
          console.error("[MOBILE AUTH DEBUG] Error during auth error cleanup:", cleanupError);
        }
      }
    };

    // Register the auth error handler
    setAuthErrorHandler(handleAuthError);

    // Cleanup function to remove the handler when component unmounts
    return () => {
      console.log("[AUTH DEBUG] Removing authentication error handler");
      removeAuthErrorHandler();
    };
  }, [router, queryClient]);

  // Helper function to decode JWT token
  const decodeToken = (token: string) => {
    if (!token || typeof token !== "string" || token.trim() === "") {
      console.warn("Invalid token provided to decodeToken");
      return null;
    }
    try {
      return jwtDecode<{ sub: string; exp: number }>(token);
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  };

  const apiLogin = async (contact: string, password: string) => {
    const response = await authService.login({ contact, password });
    return response;
  };

  const fetchAndUpdateUserData = useCallback(async (token: string, forceRefresh = false) => {
    console.log(`[AUTH DEBUG] fetchAndUpdateUserData called - forceRefresh: ${forceRefresh}, isFetchingUserRef.current: ${isFetchingUserRef.current}`);

    // Prevent duplicate concurrent user fetching using ref to avoid stale closure issues
    if (isFetchingUserRef.current && !forceRefresh) {
      console.log("[AUTH DEBUG] User fetch already in progress, skipping");
      return null;
    }

    console.log("[AUTH DEBUG] Starting user data fetch");
    isFetchingUserRef.current = true;
    setIsFetchingUser(true);
    try {
      if (!token || typeof token !== "string" || token.trim() === "") {
        console.warn("[AUTH DEBUG] Invalid token provided to fetchAndUpdateUserData:", token);
        return null;
      }

      console.log(`[AUTH DEBUG] Token valid, length: ${token.length}`);
      const decodedToken = decodeToken(token);
      if (!decodedToken) {
        console.warn("[AUTH DEBUG] Failed to decode token in fetchAndUpdateUserData");
        return null;
      }

      console.log(`[AUTH DEBUG] Token decoded successfully, userId: ${decodedToken.sub}`);
      console.log("[AUTH DEBUG] Calling authService.me()");

      // Use /auth/me endpoint to avoid privilege issues
      const response = await authService.me();
      console.log("[AUTH DEBUG] authService.me() response received:", response.success);

      // The response has the structure: { success: true, message: string, data: userData }
      const data = response.data;
      console.log(`[AUTH DEBUG] User data received: id=${data.id}, name=${data.name}, verified=${data.verified}, logged=${(data as any).logged}`);

      // Check if user is flagged as logged out from admin panel
      if ((data as any).logged === false) {
        console.log("[AUTH DEBUG] User is flagged as logged out by admin");
        // Instead of calling logout, just clear the state and return null
        // The calling function will handle the logout
        return null;
      }

      console.log("[AUTH DEBUG] Setting user state and storing user data");
      setUser(data);
      await storeUserData(data);

      // Safely update React Query cache only if queryClient is available
      try {
        if (queryClient) {
          console.log("[AUTH DEBUG] Updating React Query cache");
          queryClient.setQueryData(USER_QUERY_KEYS.detail(decodedToken.sub), {
            data,
          });
        }
      } catch (cacheError) {
        console.warn("[AUTH DEBUG] Failed to update React Query cache:", cacheError);
      }
      console.log("[AUTH DEBUG] User data fetch successful");
      return data;
    } catch (error) {
      console.error("[AUTH DEBUG] Error fetching user data:", error);

      // Handle rate limiting specifically
      if (error?.statusCode === 429) {
        console.log("[AUTH DEBUG] Rate limited (429), retrying in 30 seconds...");
        // Don't clear token on rate limiting, just wait
        setTimeout(() => {
          if (!user && token) {
            fetchAndUpdateUserData(token, true);
          }
        }, 30000);
        return null;
      }

      // Check if it's a 401 authentication error
      if (error?.message?.includes("não está autorizado") || error?.status === 401) {
        // Clear invalid auth state and force re-login
        console.log("[AUTH DEBUG] Authentication failed (401), clearing all auth data");
        try {
          await removeStoredToken();
          await removeUserData();
          setAccessToken(null);
          setCachedToken(null);
          setUser(null);
          setAuthToken(null);
        } catch (cleanupError) {
          console.error("[AUTH DEBUG] Error during auth cleanup:", cleanupError);
        }
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      console.log("[AUTH DEBUG] Non-auth error, checking for cached user data");
      // For other errors, try to use cached user data
      const cachedUser = await getUserData();
      if (cachedUser) {
        console.log(`[AUTH DEBUG] Found cached user: id=${cachedUser.id}, name=${cachedUser.name}`);
        // Check if user is flagged as logged out from admin panel
        if ((cachedUser as any).logged === false) {
          console.log("[AUTH DEBUG] Cached user is flagged as logged out");
          // Instead of calling logout, just return null
          // The calling function will handle the logout
          return null;
        }
        setUser(cachedUser);
        return cachedUser;
      }

      console.log("[AUTH DEBUG] No cached data available");
      // Return null to indicate failure
      return null;
    } finally {
      console.log("[AUTH DEBUG] fetchAndUpdateUserData completed");
      isFetchingUserRef.current = false;
      setIsFetchingUser(false);
    }
  }, []); // No dependencies to avoid stale closures and circular dependencies

  const validateSession = useCallback(async () => {
    console.log("[AUTH DEBUG] validateSession function called");

    // Prevent concurrent validations
    const now = Date.now();
    if (now - lastValidationTime.current < 1000) {
      console.log("[AUTH DEBUG] Validation called too soon after last validation, skipping");
      return;
    }
    lastValidationTime.current = now;

    console.log("[AUTH DEBUG] Starting session validation");
    setIsValidatingSession(true);

    try {
      console.log("[AUTH DEBUG] Getting stored token");
      const token = await getStoredToken();
      console.log(`[AUTH DEBUG] Token retrieved: ${token ? `exists (length: ${token.length})` : "null"}`);

      if (token) {
        console.log("[AUTH DEBUG] Token found, setting access token and auth token");
        setAccessToken(token);
        setCachedToken(token);
        setAuthToken(token);

        console.log("[AUTH DEBUG] Calling fetchAndUpdateUserData");
        const userData = await fetchAndUpdateUserData(token);

        // If fetchAndUpdateUserData returns null, clear auth state
        if (!userData) {
          console.log("[AUTH DEBUG] No user data returned from fetchAndUpdateUserData, clearing auth state");
          await removeStoredToken();
          await removeUserData();
          setAccessToken(null);
          setCachedToken(null);
          setUser(null);
          setAuthToken(null);
          return;
        }
        console.log(`[AUTH DEBUG] Session validation successful, user: ${userData.name}, id: ${userData.id}`);
      } else {
        console.log("[AUTH DEBUG] No token found, clearing auth state");
        setUser(null);
        setAccessToken(null);
        setCachedToken(null);
        setAuthToken(null);
      }
    } catch (error) {
      console.error("[AUTH DEBUG] validateSession error:", error);
      console.log("[AUTH DEBUG] Clearing invalid token state");
      // Clear invalid token state
      await removeStoredToken();
      setAccessToken(null);
      setCachedToken(null);
      setUser(null);
      setAuthToken(null);

      console.log("[AUTH DEBUG] Checking for cached user data");
      // Try to get cached user data even if session validation fails
      const cachedUser = await getUserData();
      if (cachedUser) {
        console.log(`[AUTH DEBUG] Found cached user during error recovery: id=${cachedUser.id}`);
        // Check if user is flagged as logged out from admin panel
        if ((cachedUser as any).logged === false) {
          console.log("[AUTH DEBUG] Cached user is flagged as logged out");
          // Clear auth data instead of calling logout
          await removeUserData();
          return;
        }
        // Don't use cached user if there was an auth error - force re-login
        console.log("[AUTH DEBUG] Removing cached user data due to auth error");
        await removeUserData();
      } else {
        console.log("[AUTH DEBUG] No cached user data found");
      }
    } finally {
      console.log("[AUTH DEBUG] validateSession completed - setting loading=false, isAuthReady=true");
      setLoading(false);
      setIsAuthReady(true);
      setIsValidatingSession(false);
      console.log("[AUTH DEBUG] Final auth state:", {
        user: user ? `${user.name} (${user.id})` : "null",
        accessToken: accessToken ? "exists" : "null",
        isAuthenticated: !!user,
        isAuthReady: true,
      });
    }
  }, [fetchAndUpdateUserData]);

  // Initial mount effect to validate session - run only once
  useEffect(() => {
    console.log("[AUTH DEBUG] Initial mount effect triggered");

    // Add a small delay to ensure React Query is fully initialized
    console.log("[AUTH DEBUG] Setting timeout for validateSession (100ms)");
    const timeoutId = setTimeout(() => {
      console.log("[AUTH DEBUG] Timeout reached, calling validateSession");
      validateSession();
    }, 100);

    return () => {
      console.log("[AUTH DEBUG] Initial mount effect cleanup");
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array to run only once on mount

  // Handle app state changes (foreground/background)
  useEffect(() => {
    console.log("[AUTH DEBUG] Setting up AppState listener");

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`[AUTH DEBUG] App state changed from ${appStateRef.current} to ${nextAppState}`);

      // When app comes to foreground from background
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        console.log("[AUTH DEBUG] App came to foreground, re-validating session");

        // Call validateSession after a delay
        setTimeout(() => {
          validateSession();
        }, 100);
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      console.log("[AUTH DEBUG] Removing AppState listener");
      subscription.remove();
    };
  }, []); // Empty dependency array to avoid recreating the listener

  useEffect(() => {
    console.log(`[AUTH DEBUG] accessToken useEffect triggered - token: ${accessToken ? "exists" : "null"}`);
    if (accessToken) {
      console.log("[AUTH DEBUG] Setting auth token in API client");
      setAuthToken(accessToken);
      // Also update the cached token immediately for sync access
      setCachedToken(accessToken);
      // Also update the stored token for persistence
      console.log("[AUTH DEBUG] Storing token in storage");
      storeToken(accessToken).catch((err) => console.error("[AUTH DEBUG] Failed to store token:", err));
    } else {
      console.log("[AUTH DEBUG] Clearing auth token from API client");
      setAuthToken(null);
      // Clear the cached token
      setCachedToken(null);
      // Clear the stored token
      console.log("[AUTH DEBUG] Removing token from storage");
      removeStoredToken().catch((err) => console.error("[AUTH DEBUG] Failed to remove token:", err));
    }
  }, [accessToken]);
  const login = async (contact: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiLogin(contact, password);

      // Response structure: { success: true, message: string, data: { token: string, user: userData } }
      const access_token = response.data.token;
      const userData = response.data.user;

      // Validate the received token
      if (!access_token || typeof access_token !== "string") {
        throw new Error("Token inválido recebido do servidor");
      }

      // Decode token to get user ID without storing it yet
      const decodedToken = decodeToken(access_token);
      if (!decodedToken) {
        throw new Error("Não foi possível decodificar o token de autenticação");
      }
      // If user has been logged out by admin, prevent login
      if ((userData as any).logged === false) {
        throw new Error("Você não está autorizado a entrar no sistema, contate um administrador");
      }
      // Check if user is verified
      if (!userData.verified) {
        throw new Error("VERIFICATION_REDIRECT");
      }
      // Only store token and complete login if user is allowed
      await storeToken(access_token);
      setAccessToken(access_token);
      setCachedToken(access_token);

      // Fetch complete user data with relationships (sector, position, etc)
      try {
        const completeUserData = await fetchAndUpdateUserData(access_token);
        if (!completeUserData) {
          throw new Error("Falha ao carregar dados do usuário");
        }
      } catch (fetchError) {
        // If fetching complete data fails, use the basic data from login
        setUser(userData as User);
        await storeUserData(userData);
      }
      // Safely cache in React Query
      try {
        if (queryClient) {
          queryClient.setQueryData(USER_QUERY_KEYS.detail(decodedToken.sub), {
            data: userData,
          });
        }
      } catch (cacheError) {
        console.warn("Failed to update React Query cache during login:", cacheError);
      }
    } catch (error) {
      // Clean up any partial login state
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
    try {
      // Detect contact method type
      const contactType = detectContactMethod(data.contact);

      // Transform contact to separate email and phone fields
      const isEmail = contactType === "email";
      const transformedData: SignUpFormData = {
        name: data.name,
        password: data.password,
        ...(isEmail ? { email: data.contact } : { phone: data.contact }),
      };

      const response = await authService.register(transformedData);

      if (response.data?.token && response.data?.user) {
        const { token, user } = response.data;

        // Check if user needs verification
        if (user.verified === false) {
          // For phone numbers, return phone info
          if (contactType === "phone") {
            return {
              requiresVerification: true,
              phone: data.contact,
              userId: user.id,
            };
          }

          // For emails, return email info
          return {
            requiresVerification: true,
            email: data.contact,
            userId: user.id,
          };
        }

        // Auto-login after registration if already verified
        await storeToken(token);
        await storeUserData(user);
        setAuthToken(token);
        setAccessToken(token);
        setCachedToken(token);
        setUser(user as User);

        // Navigation will be handled by index.tsx based on user privileges
        // No need to navigate here as it causes double redirect

        return {
          requiresVerification: false,
        };
      }

      // If no token/user in response, assume verification is required
      return {
        requiresVerification: true,
        ...(contactType === "phone" ? { phone: data.contact } : { email: data.contact }),
      };
    } catch (error) {
      throw error;
    }
  };

  const logout = async (showAlert = false, alertMessage = "") => {
    setLoading(true);
    try {
      setUser(null);
      setAccessToken(null);
      setCachedToken(null);
      await removeStoredToken();
      await removeUserData();
      // Safely clear user from React Query cache
      try {
        if (queryClient) {
          queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });
          // Also clear the entire cache to prevent stale data issues
          queryClient.clear();
        }
      } catch (cacheError) {
        console.warn("Failed to clear React Query cache during logout:", cacheError);
      }
      // Clear persisted React Query cache to prevent auth issues on next login
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
        await AsyncStorage.removeItem("react-query-cache");
        console.log("[AUTH DEBUG] Cleared persisted React Query cache");
      } catch (storageError) {
        console.warn("Failed to clear persisted cache:", storageError);
      }
      // Show alert if requested
      if (showAlert && alertMessage) {
        Alert.alert("Acesso Bloqueado", alertMessage);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoading(false);
      // Use setTimeout to ensure state updates are complete before navigation
      setTimeout(() => {
        try {
          router.replace(routeToMobilePath(routes.authentication.login) as any);
        } catch (navError) {
          console.error("Navigation error during logout:", navError);
        }
      }, 100);
    }
  };
  const refreshUserData = async () => {
    if (accessToken) {
      await fetchAndUpdateUserData(accessToken, true);
    }
  };

  const recoverPassword = async (data: PasswordResetRequestFormData) => {
    try {
      await authService.requestPasswordReset(data);
    } catch (error) {
      throw error;
    }
  };

  // Create verification mutations
  const verifyCodeMutation = useMutation({
    mutationFn: (data: VerifyCodeFormData) => authService.verifyCode(data),
    onSuccess: () => {
      // Optionally refresh user data after verification
      refreshUserData();
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (data: SendVerificationFormData) => authService.resendVerification(data),
  });
  // Render a loading screen instead of null to prevent hook call errors
  if (!isAuthReady) {
    console.log("[AUTH DEBUG] Rendering loading screen - isAuthReady is false");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>Verificando autenticação...</Text>
      </View>
    );
  }

  const contextValue = {
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
  };

  console.log("[AUTH DEBUG] Rendering AuthContext.Provider with value:", {
    user: user ? `${user.name} (${user.id})` : "null",
    isAuthenticated: !!user,
    isLoading: loading,
    accessToken: accessToken ? "exists" : "null",
    isAuthReady,
  });

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
