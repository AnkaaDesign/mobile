import { createContext, useEffect, useState, useContext, ReactNode, useCallback, useRef, useMemo } from "react";
import { authService, setAuthToken, setTokenProvider, setAuthErrorHandler, removeAuthErrorHandler, cancelAllRequests, setIsLoggingOut } from '../api-client';
import { storeToken, getStoredToken, removeStoredToken, storeUserData, getUserData, removeUserData } from "@/utils/storage";
import { useRouter } from "expo-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Alert, View, Text, AppState, AppStateStatus } from "react-native";
import { detectContactMethod } from '../utils';
import { jwtDecode } from "jwt-decode";

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
  const isFetchingUserRef = useRef<boolean>(false);
  const lastValidationTime = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const hasCompletedInitialAuth = useRef<boolean>(false);

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
            queryClient.cancelQueries();
            queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });
            queryClient.clear();
          } catch {}
        }

        // AsyncStorage cleanup in background
        import('@react-native-async-storage/async-storage')
          .then(m => m.default.removeItem("react-query-cache"))
          .catch(() => {});

        // Navigate after state is cleared - small delay to let React process state updates
        setTimeout(() => {
          try {
            router.replace('/(autenticacao)/entrar' as any);
          } catch (navError) {
            console.error("Navigation error:", navError);
          }
          setIsLoggingOut(false);
        }, 50);
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

      if (oldPrivileges !== newPrivileges && queryClient) {
        try {
          await queryClient.cancelQueries();
          await queryClient.invalidateQueries();
          queryClient.clear();
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
      const error = apiError as { statusCode?: number; message?: string; status?: number };

      if (error?.statusCode === 429) {
        setTimeout(() => {
          if (!user && token) fetchAndUpdateUserData(token, true);
        }, 30000);
        return null;
      }

      if (error?.status === 401) {
        try {
          await removeStoredToken();
          await removeUserData();
          setAccessToken(null);
          setCachedToken(null);
          setUser(null);
          setAuthToken(null);
        } catch {}
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      const cachedUser = await getUserData();
      if (cachedUser && (cachedUser as any).logged !== false) {
        setUser(cachedUser);
        return cachedUser;
      }

      return null;
    } finally {
      isFetchingUserRef.current = false;
      setIsFetchingUser(false);
    }
  }, [user, queryClient]);

  const validateSession = useCallback(async () => {
    const now = Date.now();
    if (now - lastValidationTime.current < 1000) {
      if (!isAuthReady) {
        setLoading(false);
        setIsAuthReady(true);
      }
      return;
    }
    lastValidationTime.current = now;
    setIsValidatingSession(true);

    try {
      const token = await getStoredToken();

      if (token) {
        const decodedToken = decodeToken(token);
        if (!decodedToken) {
          await removeStoredToken();
          await removeUserData();
          setAccessToken(null);
          setCachedToken(null);
          setUser(null);
          setAuthToken(null);
          return;
        }

        setAuthToken(token);
        setAccessToken(token);
        setCachedToken(token);

        const userData = await fetchAndUpdateUserData(token);

        if (userData === 'SKIP') return;

        if (!userData) {
          await removeStoredToken();
          await removeUserData();
          setAccessToken(null);
          setCachedToken(null);
          setUser(null);
          setAuthToken(null);
        }
      } else {
        setUser(null);
        setAccessToken(null);
        setCachedToken(null);
        setAuthToken(null);
      }
    } catch (error) {
      console.error("Session validation error:", error);
      await removeStoredToken();
      setAccessToken(null);
      setCachedToken(null);
      setUser(null);
      setAuthToken(null);
      await removeUserData();
    } finally {
      setLoading(false);
      setIsAuthReady(true);
      setIsValidatingSession(false);
      hasCompletedInitialAuth.current = true;
    }
  }, [fetchAndUpdateUserData, isAuthReady]);

  // Initial mount effect
  useEffect(() => {
    const timeoutId = setTimeout(() => validateSession(), 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        setTimeout(() => validateSession(), 100);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

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
    } catch (error) {
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

    // Perform cleanup in background (non-blocking)
    Promise.all([
      removeStoredToken(),
      removeUserData(),
    ]).catch(() => {});

    // React Query cleanup (non-blocking)
    if (queryClient) {
      try {
        queryClient.cancelQueries();
        queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });
        queryClient.clear();
      } catch {}
    }

    // AsyncStorage cleanup in background
    import('@react-native-async-storage/async-storage')
      .then(m => m.default.removeItem("react-query-cache"))
      .catch(() => {});

    // Navigate after state is cleared - small delay to let React process state updates
    setTimeout(() => {
      try {
        router.replace('/(autenticacao)/entrar' as any);
      } catch (navError) {
        console.error("Navigation error:", navError);
      }
      setIsLoggingOut(false);
    }, 50);
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
  }), [user, loading, accessToken, isAuthReady, verifyCodeMutation, resendVerificationMutation]);

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
