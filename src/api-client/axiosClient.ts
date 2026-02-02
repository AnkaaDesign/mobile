// packages/services/src/client.ts

import axios, { AxiosError } from "axios";
import type {
  AxiosRequestConfig,
  AxiosInstance,
  InternalAxiosRequestConfig,
  CancelTokenSource,
  AxiosResponse,
} from "axios";
import qs from "qs";
import Constants from "expo-constants";
import { notify } from "./notify";
import { safeLocalStorage } from "./platform-utils";
import { apiPerformanceLogger } from "@/utils/api-performance-logger";

// =====================
// Enhanced Type Definitions
// =====================

interface ApiErrorResponse {
  success: false;
  message: string | string[];
  timestamp: string;
  error: {
    code: string;
    details?: unknown;
  };
  errors?: string[];
  statusCode?: number;
}

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
}

interface ApiPaginatedResponse<T = unknown> extends ApiSuccessResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableNotifications: boolean;
  enableLogging: boolean;
  enableCache: boolean;
  cacheTimeout: number;
  enableRequestId: boolean;
  defaultHeaders: Record<string, string>;
  tokenProvider?: () => string | null | Promise<string | null>;
}

interface RequestMetadata {
  startTime: number;
  requestId: string;
  method: string;
  url: string;
  retryCount: number;
  isCached?: boolean;
  isReactQueryRetry?: boolean; // Track if this is a React Query retry attempt
  suppressToast?: boolean; // Suppress toast for this request
  is401Retry?: boolean; // Track if this is a 401 retry attempt (to prevent infinite loops)
}

// Extend AxiosRequestConfig to include metadata
declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: RequestMetadata;
  }
}

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
  requestKey: string;
}

interface ErrorInfo {
  title: string;
  message: string;
  _statusCode: number;
  errors: string[];
  isRetryable: boolean;
  category: ErrorCategory;
}

// Custom error class for enhanced API errors
class ApiError extends Error {
  title: string;
  _statusCode: number;
  errors: string[];
  category: ErrorCategory;
  isRetryable: boolean;
  requestId?: string;
  originalError?: unknown;

  constructor(
    errorInfo: ErrorInfo,
    requestId?: string,
    originalError?: unknown,
  ) {
    super(errorInfo.message);
    this.name = "ApiError";
    this.title = errorInfo.title;
    this._statusCode = errorInfo._statusCode;
    this.errors = errorInfo.errors;
    this.category = errorInfo.category;
    this.isRetryable = errorInfo.isRetryable;
    this.requestId = requestId;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

enum ErrorCategory {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  CONFLICT = "conflict",
  RATE_LIMIT = "rate_limit",
  SERVER_ERROR = "server_error",
  TIMEOUT = "timeout",
  UNKNOWN = "unknown",
}

interface EnhancedError extends Error {
  category?: ErrorCategory;
}

interface ExtendedAxiosInstance extends AxiosInstance {
  cancelAllRequests?: () => void;
  clearCache?: () => void;
}

// =====================
// Configuration
// =====================

// Track the current API URL (managed by NetworkContext)
let currentApiUrl: string | null = null;

// Get the default API URL from configuration
// Priority: window global > expo config > env variable > default
const getDefaultApiUrl = (): string => {
  // Priority 1: Check for dynamically set URL (from NetworkContext)
  if (
    typeof (globalThis as any).window !== "undefined" &&
    (globalThis as any).window.__ANKAA_API_URL__
  ) {
    return (globalThis as any).window.__ANKAA_API_URL__;
  }

  // Priority 2: Check expo config (from app.json extra.apiUrl)
  if (typeof Constants !== "undefined" && Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }

  // Priority 3: For React Native/Expo apps - check env
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Default: Production API
  return "https://api.ankaadesign.com.br";
};

// Synchronous getter for API URL (uses cached value or default)
const getApiUrl = (): string => {
  if (currentApiUrl) {
    return currentApiUrl;
  }
  return getDefaultApiUrl();
};

const DEFAULT_CONFIG: ApiClientConfig = {
  baseURL: getApiUrl(),
  timeout: 300000, // 5 minutes to allow for large file uploads
  retryAttempts: 0, // Disable retries to prevent infinite loops with rate limiting
  retryDelay: 1000,
  enableNotifications: true,
  enableLogging: process.env.NODE_ENV === "development", // Only enable logging in development
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableRequestId: true,
  defaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// =====================
// Utility Functions
// =====================

const isWriteMethod = (method?: string): boolean =>
  ["post", "patch", "put", "delete"].includes(method?.toLowerCase() || "");

const isCacheableMethod = (method?: string): boolean =>
  ["get", "head"].includes(method?.toLowerCase() || "");

const generateRequestId = (): string =>
  `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createCacheKey = (config: AxiosRequestConfig): string => {
  const { method, url, params, data } = config;
  return `${method?.toUpperCase()}_${url}_${JSON.stringify(params)}_${JSON.stringify(data)}`;
};

const getSuccessMessage = (method?: string): string => {
  const methodMessages: Record<string, string> = {
    post: "Criado com sucesso",
    patch: "Atualizado com sucesso",
    put: "Atualizado com sucesso",
    delete: "Excluído com sucesso",
  };

  return (
    methodMessages[method?.toLowerCase() || ""] ||
    "Operação realizada com sucesso"
  );
};

const shouldRetry = (
  error: AxiosError,
  attempt: number,
  maxAttempts: number,
): boolean => {
  if (attempt >= maxAttempts) return false;

  // Don't retry client errors (4xx) - especially rate limits (429)
  const status = error.response?.status;
  if (status && status >= 400 && status < 500) {
    // Never retry rate limit errors (429) to avoid infinite loops
    // Only retry 408 (timeout) as it might be a temporary network issue
    return status === 408;
  }

  // Retry network errors, timeouts, and server errors (5xx)
  return !!(
    !error.response || // Network error
    error.code === "ECONNABORTED" || // Timeout
    error.code === "ETIMEDOUT" || // Timeout
    error.message === "Network Error" || // Network error
    (status && status >= 500) // Server error
  );
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// =====================
// Request Retry Tracking & Toast Deduplication
// =====================
//
// This system prevents duplicate error toasts when React Query retries failed requests.
//
// Problem: React Query automatically retries failed requests (3x for queries, 1x for mutations).
// Each retry attempt would trigger a new error toast from Axios, resulting in multiple toasts
// for the same operation.
//
// Solution: Track recent errors and suppress duplicate toasts within a deduplication window (2s).
// This ensures users only see ONE error toast for a failed operation, even if it's retried
// multiple times by React Query.
//
// The tracker:
// 1. Records each error by request key (method:url)
// 2. Checks if a similar error occurred within the deduplication window
// 3. Suppresses the toast if it's a duplicate
// 4. Clears tracking when requests succeed
// 5. Auto-cleans old entries every 30 seconds

interface RetryTrackingEntry {
  lastErrorTime: number;
  errorCount: number;
  lastErrorMessage: string;
}

class RequestRetryTracker {
  private retryingRequests = new Map<string, RetryTrackingEntry>();
  private readonly deduplicationWindow = 5000; // 5 seconds window for deduplication (matches toast manager)

  private getRequestKey(url: string, method: string): string {
    return `${method.toUpperCase()}:${url}`;
  }

  // Check if we should show a toast for this error
  shouldShowToast(url: string, method: string, errorMessage: string): boolean {
    const key = this.getRequestKey(url, method);
    const now = Date.now();
    const existing = this.retryingRequests.get(key);

    if (!existing) {
      // First time seeing this error
      this.retryingRequests.set(key, {
        lastErrorTime: now,
        errorCount: 1,
        lastErrorMessage: errorMessage,
      });
      return true;
    }

    // Check if this is within the deduplication window
    const timeSinceLastError = now - existing.lastErrorTime;

    if (timeSinceLastError < this.deduplicationWindow) {
      // Same error within deduplication window - don't show toast
      existing.errorCount++;
      existing.lastErrorTime = now;
      return false;
    }

    // Outside deduplication window - show toast and reset
    this.retryingRequests.set(key, {
      lastErrorTime: now,
      errorCount: 1,
      lastErrorMessage: errorMessage,
    });
    return true;
  }

  // Mark a request as completed successfully
  clearRequest(url: string, method: string): void {
    const key = this.getRequestKey(url, method);
    this.retryingRequests.delete(key);
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now();
    const maxAge = 60000; // 60 seconds

    for (const [key, entry] of this.retryingRequests.entries()) {
      if (now - entry.lastErrorTime > maxAge) {
        this.retryingRequests.delete(key);
      }
    }
  }
}

// =====================
// Cache Management
// =====================

class RequestCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize = 100;
  private readonly defaultTimeout: number;

  constructor(defaultTimeout: number) {
    this.defaultTimeout = defaultTimeout;
  }

  set<T>(key: string, data: T, timeout?: number): void {
    // Clean expired entries if cache is getting large
    if (this.cache.size >= this.maxSize) {
      this.cleanExpired();

      // If still too large, remove oldest entries
      if (this.cache.size >= this.maxSize) {
        const oldestKeys = Array.from(this.cache.keys()).slice(0, 20);
        oldestKeys.forEach((k) => this.cache.delete(k));
      }
    }

    const now = Date.now();
    const expiresAt = now + (timeout || this.defaultTimeout);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      requestKey: key,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// =====================
// Enhanced API Client Factory
// =====================

const createApiClient = (
  config: Partial<ApiClientConfig> = {},
): ExtendedAxiosInstance => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const cache = new RequestCache(finalConfig.cacheTimeout);
  const cancelTokens = new Map<string, CancelTokenSource>();
  const retryTracker = new RequestRetryTracker();

  // Periodic cleanup of retry tracking entries
  const cleanupInterval = setInterval(() => {
    retryTracker.cleanup();
  }, 30000); // Clean up every 30 seconds

  const client = axios.create({
    baseURL: finalConfig.baseURL,
    timeout: finalConfig.timeout,
    headers: finalConfig.defaultHeaders,
    paramsSerializer: {
      serialize: (params) => {
        // Handle complex nested objects by JSON-stringifying them
        // This is needed for nested structures like 'include' that the backend expects as JSON
        const processedParams: Record<string, any> = {};

        for (const [key, value] of Object.entries(params)) {
          if (value === null || value === undefined) {
            continue; // Skip null/undefined values
          }

          // CRITICAL: Skip empty strings entirely - they cause API validation errors
          if (value === "") {
            continue;
          }

          // CRITICAL: Extra safeguard for similarColor - must be valid hex format
          // API schema requires: /^#[0-9A-Fa-f]{6}$/ format
          if (key === "similarColor") {
            if (
              typeof value !== "string" ||
              value === "" ||
              value === "#000000" ||
              !/^#[0-9A-Fa-f]{6}$/.test(value)
            ) {
              continue;
            }
          }

          // Check if this is a complex nested object (more than 1 level deep)
          if (
            typeof value === "object" &&
            !Array.isArray(value) &&
            !(value instanceof Date)
          ) {
            // Check if it has nested objects
            const hasNestedObjects = Object.values(value).some(
              (v) =>
                v !== null &&
                typeof v === "object" &&
                !Array.isArray(v) &&
                !(v instanceof Date),
            );

            if (hasNestedObjects) {
              // JSON-stringify complex nested objects
              processedParams[key] = JSON.stringify(value);
            } else {
              // Keep simple objects for qs.stringify
              processedParams[key] = value;
            }
          } else {
            processedParams[key] = value;
          }
        }

        const queryString = qs.stringify(processedParams, {
          arrayFormat: "indices", // Match web: use indices for arrays (orderBy[0].field=asc instead of orderBy[].field=asc)
          encode: true, // CRITICAL: Must encode special characters like # in hex colors (e.g., #FF0000 -> %23FF0000)
          serializeDate: (date: Date) => date.toISOString(),
          skipNulls: true,
          addQueryPrefix: false,
          allowDots: true, // Match web: use dot notation for nested objects (orderBy[0].forecastDate.sort=asc)
          strictNullHandling: true,
          indices: true, // Match web: produce orderBy[0].name=asc instead of orderBy[].name=asc
        });

        return queryString;
      },
    },
    // Enhanced validation for responses
    validateStatus: (status) => status >= 200 && status < 300,
  });

  // =====================
  // Request Interceptor
  // =====================

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const requestId = generateRequestId();
      const startTime = Date.now();

      // Merge with existing metadata (preserve custom flags like suppressToast)
      const metadata: RequestMetadata = {
        ...config.metadata, // Preserve any existing metadata
        startTime,
        requestId,
        method: config.method?.toUpperCase() || "UNKNOWN",
        url: config.url || "",
        retryCount: config.metadata?.retryCount || 0,
      };

      config.metadata = metadata;

      // Log API request start
      apiPerformanceLogger.startRequest(
        requestId,
        config.url || '',
        config.method?.toUpperCase() || 'GET',
        config.data
      );

      // Auto-attach token if tokenProvider is configured
      const tokenProvider =
        (client as any).__tokenProvider ||
        globalTokenProvider ||
        finalConfig.tokenProvider;

      // Skip public auth endpoints to avoid sending corrupted tokens
      const isPublicAuthEndpoint =
        config.url?.includes("/auth/login") ||
        config.url?.includes("/auth/register") ||
        config.url?.includes("/auth/password-reset") ||
        config.url?.includes("/auth/verify") ||
        config.url?.includes("/auth/send-verification") ||
        config.url?.includes("/auth/resend-verification");

      if (tokenProvider && !isPublicAuthEndpoint) {
        try {
          const token = await tokenProvider();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          } else if (
            !config.url?.includes("/auth/") &&
            (client as any).__justLoggedIn
          ) {
            // If no token and not an auth endpoint, check if we just logged in
            await delay(300);
            const retryToken = await tokenProvider();
            if (retryToken) {
              config.headers.Authorization = `Bearer ${retryToken}`;
            }
          }
        } catch {
          // Silently fail if token retrieval fails
        }
      }

      // Add request ID header if enabled
      if (finalConfig.enableRequestId) {
        config.headers["X-Request-ID"] = requestId;
      }

      // Fix array serialization for batch operations
      if (
        config.url?.includes("/batch") &&
        config.method?.toLowerCase() === "put"
      ) {
        if (
          config.data &&
          typeof config.data === "object" &&
          !Array.isArray(config.data)
        ) {
          const fixedData: any = {};
          for (const key in config.data) {
            const value = config.data[key];
            if (value && typeof value === "object" && !Array.isArray(value)) {
              const keys = Object.keys(value);
              const isNumericKeys = keys.every((k) => /^\d+$/.test(k));
              if (isNumericKeys) {
                fixedData[key] = Object.values(value);
              } else {
                fixedData[key] = value;
              }
            } else {
              fixedData[key] = value;
            }
          }
          config.data = JSON.parse(JSON.stringify(fixedData));
        }
      }

      // Fix array serialization issue for external-withdrawals
      if (
        config.url?.includes("/external-withdrawals") &&
        config.method?.toLowerCase() === "post"
      ) {
        if (
          config.data &&
          typeof config.data === "object" &&
          !Array.isArray(config.data)
        ) {
          if (
            config.data.items &&
            typeof config.data.items === "object" &&
            !Array.isArray(config.data.items)
          ) {
            config.data = {
              ...config.data,
              items: Object.values(config.data.items),
            };
          }
          if (config.data.items && Array.isArray(config.data.items)) {
            config.data = JSON.parse(JSON.stringify(config.data));
          }
        }
      }

      // Handle FormData - let axios set the correct Content-Type for multipart/form-data
      // This is critical for file uploads in React Native
      if (config.data instanceof FormData) {
        // Remove Content-Type header so axios/React Native can set the correct boundary
        delete config.headers["Content-Type"];
      }

      // Add cache-busting for GET requests (but not for cached responses)
      if (config.method === "get" && !finalConfig.enableCache) {
        config.params = { ...config.params, _t: Date.now() };
      }

      // Check cache for GET requests
      if (finalConfig.enableCache && isCacheableMethod(config.method)) {
        const cacheKey = createCacheKey(config);
        const cachedResponse = cache.get(cacheKey);

        if (cachedResponse) {
          metadata.isCached = true;
          return Promise.resolve(config);
        }
      }

      // Create cancel token for this request
      const cancelToken = axios.CancelToken.source();
      config.cancelToken = cancelToken.token;
      cancelTokens.set(requestId, cancelToken);

      return config;
    },
    (error: AxiosError) => {
      const enhancedError = new Error(
        "Erro ao preparar a requisição. Tente novamente.",
      ) as EnhancedError;
      enhancedError.category = ErrorCategory.UNKNOWN;
      return Promise.reject(enhancedError);
    },
  );

  // =====================
  // Response Interceptor
  // =====================

  client.interceptors.response.use(
    (response: AxiosResponse<ApiSuccessResponse | ApiPaginatedResponse>) => {
      const config = response.config as InternalAxiosRequestConfig;
      const metadata = config.metadata as RequestMetadata;
      const duration = Date.now() - metadata.startTime;
      const requestId = metadata.requestId;

      // Clean up cancel token
      if (requestId) {
        cancelTokens.delete(requestId);
      }

      // Log API request completion
      if (requestId) {
        apiPerformanceLogger.endRequest(
          requestId,
          response.status,
          response.data
        );
      }

      // Cache successful GET responses
      if (
        finalConfig.enableCache &&
        isCacheableMethod(config.method) &&
        !metadata.isCached
      ) {
        const cacheKey = createCacheKey(config);
        cache.set(cacheKey, response.data);
      }

      // Dismiss any pending retry toasts for this request
      if (finalConfig.enableNotifications && metadata) {
        notify.dismissRetry?.(metadata.url, metadata.method);
        // Clear retry tracking for successful requests
        retryTracker.clearRequest(metadata.url, metadata.method);
      }

      // Show success notification for write operations
      if (finalConfig.enableNotifications && isWriteMethod(config.method)) {
        // Skip notifications for specific operations that handle their own success messages
        const isBatchOperation = config.url?.includes("/batch");
        const isAuthOperation =
          config.url?.includes("/auth/login") ||
          config.url?.includes("/auth/register") ||
          config.url?.includes("/auth/logout");
        // Skip notifications for background operations that shouldn't show toasts
        const isBackgroundOperation =
          config.url?.includes("/notifications/device-token") ||
          config.url?.includes("/notifications/preferences") ||
          config.url?.includes("/mark-as-read") ||
          config.url?.includes("/mark-all-as-read");

        // Only show success if the response indicates success
        const isSuccess = response.data?.success !== (false as boolean); // Show success unless explicitly false

        if (
          !isBatchOperation &&
          !isAuthOperation &&
          !isBackgroundOperation &&
          isSuccess
        ) {
          const message =
            response.data?.message || getSuccessMessage(config.method);
          notify.success("Sucesso", message);
        }
      }

      return response;
    },
    async (error: AxiosError<ApiErrorResponse>) => {
      const config = error.config as InternalAxiosRequestConfig;
      const metadata = config?.metadata as RequestMetadata;
      const requestId = metadata?.requestId;

      // Clean up cancel token
      if (requestId) {
        cancelTokens.delete(requestId);
      }

      // Log API error
      if (requestId) {
        apiPerformanceLogger.endRequest(
          requestId,
          error.response?.status || 0,
          error.response?.data,
          error
        );
      }

      // NOTE: Network-based URL switching is now handled centrally by NetworkContext.
      // The base URL is automatically updated when network connectivity changes.
      // No per-call fallback logic is needed here.

      // Handle retry logic
      if (
        config &&
        metadata &&
        shouldRetry(error, metadata.retryCount, finalConfig.retryAttempts)
      ) {
        metadata.retryCount++;

        // Show retry notification
        if (finalConfig.enableNotifications) {
          const errorInfo = handleApiError(error);
          notify.retry(
            "Tentando novamente...",
            errorInfo.message,
            metadata.url,
            metadata.method,
            metadata.retryCount,
            finalConfig.retryAttempts,
          );
        }

        // Calculate exponential backoff delay
        const backoffDelay =
          finalConfig.retryDelay * Math.pow(2, metadata.retryCount - 1);
        await delay(backoffDelay);

        // Create new cancel token for retry
        const newCancelToken = axios.CancelToken.source();
        config.cancelToken = newCancelToken.token;
        cancelTokens.set(requestId, newCancelToken);

        return client.request(config);
      }

      // Process and handle the error
      const errorInfo = handleApiError(error);

      // NOTE: This API uses JWT access tokens without separate refresh tokens.
      // The /auth/refresh endpoint requires a valid access token to extract userId,
      // so it cannot be used to recover from expired/invalid tokens.
      // On 401 errors, we should clear auth state and redirect to login (handled by auth error handler).

      // Handle authentication errors (401 ONLY) - trigger logout and redirect to login
      // IMPORTANT: 403 errors are AUTHORIZATION errors (permission denied), NOT authentication errors
      // We should NOT trigger logout for 403 - the user is authenticated but lacks permission
      // Skip auth error handler for login endpoint itself to avoid infinite loops
      // Also skip during logout to prevent recursive issues
      if (
        !isLoggingOut &&
        errorInfo.category === ErrorCategory.AUTHENTICATION &&
        errorInfo._statusCode === 401 &&
        !config.url?.includes("/auth/login")
      ) {
        // SMART 401 RETRY: Before triggering logout, try to get a fresh token
        // This handles race conditions where token might have been refreshed by another request
        // Only attempt ONE retry to prevent infinite loops
        if (!metadata?.is401Retry && globalTokenProvider) {
          try {
            const freshToken = await globalTokenProvider();

            // Only retry if we got a token and it's different from what was used
            const usedToken = config.headers?.Authorization?.toString()?.replace('Bearer ', '');

            if (freshToken && freshToken !== usedToken) {
              console.log('[AxiosClient] 401 received, retrying with fresh token');

              // Mark this as a 401 retry to prevent infinite loops
              const retryConfig = { ...config };
              retryConfig.metadata = {
                ...metadata,
                is401Retry: true,
                startTime: Date.now(),
                retryCount: (metadata?.retryCount || 0) + 1,
              };
              retryConfig.headers = { ...config.headers };
              retryConfig.headers.Authorization = `Bearer ${freshToken}`;

              // Create new cancel token for retry
              const newCancelToken = axios.CancelToken.source();
              retryConfig.cancelToken = newCancelToken.token;

              return client.request(retryConfig);
            }
          } catch (retryError) {
            // Fresh token retrieval failed, proceed with logout
            console.log('[AxiosClient] Failed to get fresh token for 401 retry');
          }
        }

        // No fresh token available or retry already attempted - trigger logout
        if (globalAuthErrorHandler) {
          try {
            globalAuthErrorHandler({
              statusCode: errorInfo._statusCode,
              message: errorInfo.message,
              category: errorInfo.category,
            });
          } catch {}
        }
      }

      // Show error notification with detailed messages
      if (finalConfig.enableNotifications && metadata) {
        if (!isLoggingOut) {
          // Skip notifications for batch operations - they'll be handled by the dialog
          const isBatchOperation = config?.url?.includes("/batch");
          // Skip notifications for file uploads - they should be handled by upload components
          const isFileUpload = config?.url?.includes("/files/upload");
          // Skip notifications for my-secullum-calculations - handled by component with friendly message
          const isMySecullumCalculations = config?.url?.includes(
            "/my-secullum-calculations",
          );

          // Check if we should show this toast (deduplication check)
          const shouldShow = retryTracker.shouldShowToast(
            metadata.url,
            metadata.method,
            errorInfo.message,
          );

          if (
            !isBatchOperation &&
            !isFileUpload &&
            !isMySecullumCalculations &&
            shouldShow
          ) {
            // For rate limit errors, show specialized message
            if (errorInfo.category === ErrorCategory.RATE_LIMIT) {
              notify.error("Limite de Requisições", errorInfo.message, {
                duration: 8000,
              });
            } else if (errorInfo.errors && errorInfo.errors.length > 1) {
              // For multiple errors, show all details
              notify.error(errorInfo.title, errorInfo.message, {
                duration: 10000,
              });
            } else {
              notify.error(errorInfo.title, errorInfo.message);
            }
          }
        }
      }

      // Create enhanced error with additional metadata
      const enhancedError = new ApiError(errorInfo, requestId, error);

      return Promise.reject(enhancedError);
    },
  );

  // Add method to cancel all pending requests
  const extendedClient = client as ExtendedAxiosInstance;
  extendedClient.cancelAllRequests = () => {
    for (const [requestId, cancelToken] of cancelTokens.entries()) {
      cancelToken.cancel(`Request ${requestId} cancelled by user`);
    }
    cancelTokens.clear();
  };

  // Add method to clear cache
  extendedClient.clearCache = () => {
    cache.clear();
  };

  // Add cleanup method for when the client is destroyed
  (extendedClient as any).destroy = () => {
    clearInterval(cleanupInterval);
    cancelTokens.clear();
    cache.clear();
  };

  return extendedClient;
};

// =====================
// Enhanced Error Handling
// =====================

const handleApiError = (error: unknown): ErrorInfo => {
  const defaultError: ErrorInfo = {
    title: "Erro",
    message: "Erro desconhecido. Tente novamente.",
    _statusCode: 500,
    errors: [],
    isRetryable: false,
    category: ErrorCategory.UNKNOWN,
  };

  // Handle axios cancel
  if (axios.isCancel(error)) {
    return {
      title: "Operação Cancelada",
      message: "A operação foi cancelada.",
      _statusCode: 0,
      errors: ["Cancelled"],
      isRetryable: false,
      category: ErrorCategory.UNKNOWN,
    };
  }

  // Type guard for axios error
  if (!axios.isAxiosError(error)) {
    return defaultError;
  }

  // Network or timeout errors
  if (
    !error.response ||
    error.code === "ECONNABORTED" ||
    error.message === "Network Error"
  ) {
    return {
      title: "Erro de Conexão",
      message:
        "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.",
      _statusCode: 0,
      errors: ["Erro de conectividade"],
      isRetryable: true,
      category: ErrorCategory.NETWORK,
    };
  }

  // Server timeout
  if (error.code === "ETIMEDOUT") {
    return {
      title: "Tempo Esgotado",
      message: "A operação demorou mais que o esperado. Tente novamente.",
      _statusCode: 408,
      errors: ["Timeout"],
      isRetryable: true,
      category: ErrorCategory.TIMEOUT,
    };
  }

  const response = error.response;
  const errorData = response?.data;
  const statusCode = response?.status || 500;

  // Ultra-robust error message extraction with detailed logging
  let errorMessages: string[] = [];
  let mainMessage = "";
  let detailedError = "";

  if (errorData) {
    // Primary extraction - try to get the most detailed error first
    const extractionSources = [
      // Try exception stack first line (most detailed)
      errorData.exception?.stack?.[0],
      // Try nested error structures common in NestJS
      errorData.response?.message,
      errorData.response?.error,
      // Try validation errors array (from Zod validation pipe) - join them for display
      Array.isArray(errorData.errors) && errorData.errors.length > 0
        ? errorData.errors.join("\n")
        : null,
      // Try specific error fields
      errorData.error,
      errorData.detail,
      errorData.details,
      errorData.description,
      errorData.reason,
      errorData.cause,
      // Original error messages
      errorData.originalError?.message,
      // For batch operation first failed item (common pattern)
      errorData.data?.failed?.[0]?.error,
      // Main message field
      errorData.message,
    ].filter(Boolean);

    // Find the most detailed error message
    for (const source of extractionSources) {
      if (typeof source === "string") {
        // Extract from exception stack format (e.g., "BadRequestException: Actual detailed error")
        const stackMatch = source.match(/^\w+Exception: (.+)$/);
        const candidate = stackMatch ? stackMatch[1] : source;

        // Use the most detailed/longest meaningful error message
        if (candidate.trim() && candidate.length > 10) {
          if (!detailedError || candidate.length > detailedError.length) {
            detailedError = candidate;
          }
        }
      }
    }

    // Use the most detailed error as main message
    if (detailedError) {
      mainMessage = detailedError;
      errorMessages = [detailedError];
    }

    // Handle main message if no detailed error found
    if (!mainMessage) {
      if (Array.isArray(errorData.message)) {
        errorMessages = errorData.message;
        mainMessage = errorMessages.join("\n");
      } else if (typeof errorData.message === "string") {
        mainMessage = errorData.message;
        errorMessages = [errorData.message];
      }
    }

    // Include additional errors if available
    if (errorData.errors && Array.isArray(errorData.errors)) {
      const additionalErrors = errorData.errors.filter(
        (err: string) => !errorMessages.includes(err),
      );
      errorMessages = [...errorMessages, ...additionalErrors];

      if (additionalErrors.length > 0) {
        if (mainMessage) {
          mainMessage = mainMessage + "\n\n" + additionalErrors.join("\n");
        } else {
          mainMessage = additionalErrors.join("\n");
        }
      }
    }

    // Handle batch operation failures with detailed extraction
    if (errorData.data?.failed && Array.isArray(errorData.data.failed)) {
      const failedDetails = errorData.data.failed.map(
        (item: any, index: number) => {
          const itemIndex = item.index !== undefined ? item.index : index;

          // Extract the most detailed error from the failed item
          const itemErrorSources = [
            item.errorDetails?.message,
            item.error,
            item.message,
            item.details,
            item.reason,
          ].filter(Boolean);

          const itemError = itemErrorSources[0] || "Erro desconhecido";
          return `• Item ${itemIndex + 1}: ${itemError}`;
        },
      );

      if (failedDetails.length > 0) {
        const batchErrorMessage = `\n\nDetalhes dos erros:\n${failedDetails.join("\n")}`;
        mainMessage = mainMessage
          ? mainMessage + batchErrorMessage
          : `Erros na operação em lote:${batchErrorMessage}`;
        errorMessages = [...errorMessages, ...failedDetails];
      }
    }

    // Final validation - ensure we have a meaningful message
    if (!mainMessage && errorData.message) {
      mainMessage =
        typeof errorData.message === "string"
          ? errorData.message
          : "Erro desconhecido";
      errorMessages = [mainMessage];
    }
  }

  // Fallback to error message
  if (!mainMessage && error.message) {
    mainMessage = error.message;
    errorMessages = [error.message];
  }

  // Determine error category and retryability
  const { category, isRetryable } = categorizeError(statusCode);

  // Set appropriate title based on status code
  const title = getErrorTitle(statusCode);

  // Enhance message based on status code
  const enhancedMessage = enhanceErrorMessage(mainMessage);

  return {
    title,
    message: enhancedMessage || defaultError.message,
    _statusCode: statusCode,
    errors: errorMessages.length > 0 ? errorMessages : defaultError.errors,
    isRetryable,
    category,
  };
};

const categorizeError = (
  statusCode: number,
): { category: ErrorCategory; isRetryable: boolean } => {
  if (statusCode >= 500) {
    return { category: ErrorCategory.SERVER_ERROR, isRetryable: true };
  }

  switch (statusCode) {
    case 400:
    case 422:
      return { category: ErrorCategory.VALIDATION, isRetryable: false };
    case 401:
      return { category: ErrorCategory.AUTHENTICATION, isRetryable: false };
    case 403:
      return { category: ErrorCategory.AUTHORIZATION, isRetryable: false };
    case 404:
      return { category: ErrorCategory.NOT_FOUND, isRetryable: false };
    case 408:
      return { category: ErrorCategory.TIMEOUT, isRetryable: true };
    case 409:
      return { category: ErrorCategory.CONFLICT, isRetryable: false };
    case 429:
      return { category: ErrorCategory.RATE_LIMIT, isRetryable: true };
    default:
      return { category: ErrorCategory.UNKNOWN, isRetryable: false };
  }
};

const getErrorTitle = (statusCode: number): string => {
  const titleMap: Record<number, string> = {
    400: "Dados Inválidos",
    401: "Não Autorizado",
    403: "Acesso Negado",
    404: "Não Encontrado",
    408: "Tempo Esgotado",
    409: "Conflito",
    422: "Dados Inválidos",
    429: "Muitas Tentativas",
    500: "Erro Interno",
    502: "Serviço Indisponível",
    503: "Serviço Indisponível",
    504: "Tempo Esgotado",
  };

  return titleMap[statusCode] || "Erro";
};

const enhanceErrorMessage = (message: string): string => {
  if (!message) return "";

  // Return message as is - backend already provides Portuguese messages
  return message;
};

// =====================
// Main API Client Instance (SINGLETON)
// =====================

// CRITICAL: Force single axios instance with lazy initialization
let singletonInstance: ExtendedAxiosInstance | null = null;

// Lazy initialization function - creates instance only when first accessed
const getSingletonInstance = (): ExtendedAxiosInstance => {
  if (singletonInstance) {
    return singletonInstance;
  }

  if (typeof (globalThis as any).window === "undefined") {
    throw new Error("Cannot create API client in non-browser environment");
  }

  singletonInstance = createApiClient({
    tokenProvider: async () => {
      // Try token sources - for React Native, only use globalTokenProvider
      // For web, try localStorage and window as fallbacks
      let token = null;

      // 1. Try the global token provider first (this is what auth context sets)
      if (globalTokenProvider) {
        try {
          token = await globalTokenProvider();
        } catch {}
      }

      // 2. For web only: Check localStorage as fallback
      if (!token) {
        const localToken = safeLocalStorage.getItem("ankaa_token");
        if (localToken) token = localToken;
      }

      // 3. For web only: Check global window token as last resort
      if (
        !token &&
        typeof (globalThis as any).window !== "undefined" &&
        (globalThis as any).window.__ANKAA_AUTH_TOKEN__
      ) {
        token = (globalThis as any).window.__ANKAA_AUTH_TOKEN__;
      }

      return token;
    },
  });

  (singletonInstance as any).__instanceId = "THE-SINGLETON";
  (globalThis as any).window.__ANKAA_API_CLIENT__ = singletonInstance;

  return singletonInstance;
};

// Export a proxy that ensures lazy initialization
export const apiClient = new Proxy({} as ExtendedAxiosInstance, {
  get(_target, prop) {
    const instance = getSingletonInstance();
    const value = (instance as any)[prop];

    // If the property is a function, bind it to the instance
    if (typeof value === "function") {
      return value.bind(instance);
    }

    return value;
  },
  set(_target, prop, value) {
    const instance = getSingletonInstance();
    (instance as any)[prop] = value;
    return true;
  },
});

// Export axios itself for cancel token usage
export { axios };

// Verification function for debugging - returns info instead of logging
// NOTE: isUsingFallback is now always false as URL switching is handled by NetworkContext
export const verifyApiClient = (): {
  exists: boolean;
  baseURL: string | undefined;
  isUsingFallback: boolean;
} => {
  return {
    exists: !!apiClient,
    baseURL: apiClient?.defaults?.baseURL,
    isUsingFallback: false, // URL switching is now managed by NetworkContext
  };
};

// =====================
// Token Management
// =====================

// Storage for the token provider to be used by the default apiClient
let globalTokenProvider:
  | (() => string | null | Promise<string | null>)
  | undefined;

// Global authentication error handler
let globalAuthErrorHandler:
  | ((error: {
      statusCode: number;
      message: string;
      category: ErrorCategory;
    }) => void)
  | undefined;

// Flag to indicate if we're in the process of logging out
let isLoggingOut = false;

export const setAuthToken = (token: string | null): void => {
  // Get the singleton instance (lazy initialization)
  const instance = getSingletonInstance();

  if (token) {
    // Ensure headers object exists
    if (!instance.defaults.headers) {
      instance.defaults.headers = {} as any;
    }
    if (!instance.defaults.headers.common) {
      instance.defaults.headers.common = {} as any;
    }

    instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Store in localStorage for web only (safeLocalStorage will no-op in React Native)
    safeLocalStorage.setItem("ankaa_token", token);

    // Store in global window for web fallback
    if (typeof (globalThis as any).window !== "undefined") {
      (globalThis as any).window.__ANKAA_AUTH_TOKEN__ = token;
    }
  } else {
    if (instance.defaults.headers?.common) {
      delete instance.defaults.headers.common["Authorization"];
    }

    // Clear from localStorage for web only (safeLocalStorage will no-op in React Native)
    safeLocalStorage.removeItem("ankaa_token");

    // Clear from global window
    if (typeof (globalThis as any).window !== "undefined") {
      delete (globalThis as any).window.__ANKAA_AUTH_TOKEN__;
    }
  }
};

// Set a token provider function that will be called for each request
export const setTokenProvider = (
  provider: () => string | null | Promise<string | null>,
): void => {
  globalTokenProvider = provider;
  if (singletonInstance) {
    (singletonInstance as any).__tokenProvider = provider;
  }
};

// Get the current token provider
export const getTokenProvider = ():
  | (() => string | null | Promise<string | null>)
  | undefined => {
  return globalTokenProvider;
};

// Set authentication error handler that will be called on 401/403 errors
export const setAuthErrorHandler = (
  handler: (error: {
    statusCode: number;
    message: string;
    category: ErrorCategory;
  }) => void,
): void => {
  globalAuthErrorHandler = handler;
};

// Remove authentication error handler
export const removeAuthErrorHandler = (): void => {
  globalAuthErrorHandler = undefined;
};

// Get the current auth error handler
export const getAuthErrorHandler = ():
  | ((error: {
      statusCode: number;
      message: string;
      category: ErrorCategory;
    }) => void)
  | undefined => {
  return globalAuthErrorHandler;
};

// Update the API URL dynamically
// This is called by NetworkContext when connectivity changes
export const updateApiUrl = (url: string): void => {
  // Update the cached URL
  currentApiUrl = url;

  // Update the global window reference
  if (typeof (globalThis as any).window !== "undefined") {
    (globalThis as any).window.__ANKAA_API_URL__ = url;
  }

  // Update the axios instance if it exists
  if (singletonInstance) {
    singletonInstance.defaults.baseURL = url;
  } else {
    try {
      const instance = getSingletonInstance();
      instance.defaults.baseURL = url;
    } catch {}
  }
};

// Mark that we just logged in (used to handle race conditions)
export const setJustLoggedIn = (): void => {
  // Only set on instance if it's already created (don't force creation)
  if (singletonInstance) {
    (singletonInstance as any).__justLoggedIn = true;
    // Clear it after a short delay
    setTimeout(() => {
      if (singletonInstance) {
        delete (singletonInstance as any).__justLoggedIn;
      }
    }, 2000);
  }
};

// Force refresh token on all requests
export const forceTokenRefresh = (token: string): void => {
  const instance = getSingletonInstance();
  if (instance?.defaults?.headers) {
    instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    safeLocalStorage.setItem("ankaa_token", token);
    if (typeof (globalThis as any).window !== "undefined") {
      (globalThis as any).window.__ANKAA_AUTH_TOKEN__ = token;
    }
  }
};

// =====================
// Utility Functions
// =====================

export const createCustomApiClient = (
  config: Partial<ApiClientConfig>,
): ExtendedAxiosInstance => {
  return createApiClient(config);
};

export const cancelAllRequests = (): void => {
  apiClient.cancelAllRequests?.();
};

export const clearApiCache = (): void => {
  apiClient.clearCache?.();
};

// Set the logging out flag
export const setIsLoggingOut = (value: boolean): void => {
  isLoggingOut = value;
};

// Get the current logging out state
export const getIsLoggingOut = (): boolean => {
  return isLoggingOut;
};

// =====================
// API URL Functions
// =====================

// Get current API URL
// NOTE: URL switching is now managed by NetworkContext based on connectivity.
// Use updateApiUrl() to change the base URL.
export const getCurrentApiUrl = (): string => {
  return currentApiUrl || getDefaultApiUrl();
};

// Alias for backwards compatibility - redirects to getCurrentApiUrl
// @deprecated Use getCurrentApiUrl instead
export const initializeApiUrl = async (): Promise<string> => {
  return getCurrentApiUrl();
};

// @deprecated - URL switching is now managed by NetworkContext
// These functions are kept for backwards compatibility but are no-ops
export const getIsUsingFallback = (): boolean => {
  // Always return false - fallback detection is now handled by NetworkContext
  return false;
};

// =====================
// Enhanced HTTP Methods with Better Type Support
// =====================

export const httpGet = <TResponse = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<TResponse>> => {
  return apiClient.get<TResponse>(url, config);
};

export const httpPost = <TResponse = unknown, TData = unknown>(
  url: string,
  data?: TData,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<TResponse>> => {
  return apiClient.post<TResponse>(url, data, config);
};

export const httpPut = <TResponse = unknown, TData = unknown>(
  url: string,
  data?: TData,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<TResponse>> => {
  return apiClient.put<TResponse>(url, data, config);
};

export const httpPatch = <TResponse = unknown, TData = unknown>(
  url: string,
  data?: TData,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<TResponse>> => {
  return apiClient.patch<TResponse>(url, data, config);
};

export const httpDelete = <TResponse = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<TResponse>> => {
  return apiClient.delete<TResponse>(url, config);
};

// =====================
// Export Types
// =====================

export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiPaginatedResponse,
  ApiClientConfig,
  ErrorInfo,
  ErrorCategory,
  RequestMetadata,
};
