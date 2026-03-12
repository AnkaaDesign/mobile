import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from "react";
import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateApiUrl, getCurrentApiUrl } from "../api-client";
import { ONLINE_API_URL, OFFLINE_API_URL } from "@/constants/api";

// =====================================================
// Constants
// =====================================================

const STORAGE_KEY_LOCAL_API = "@ankaa:network:local_api_url";
const STORAGE_KEY_SERVER_ADDRESSES = "@ankaa:network:server_addresses";
const PING_TIMEOUT = 4000; // 4 seconds to check reachability

// =====================================================
// Types & Interfaces
// =====================================================

interface NetworkContextType {
  /** Whether the device has internet connectivity */
  isConnected: boolean;
  /** Whether the network state has been determined (initial check complete) */
  isNetworkReady: boolean;
  /** The current base URL being used for API calls */
  currentBaseUrl: string;
  /** Whether currently using the offline/local URL */
  isUsingOfflineUrl: boolean;
  /** Get the appropriate API URL based on current connectivity */
  getApiUrl: () => string;
  /** Manually refresh the network state */
  refreshNetworkState: () => Promise<void>;
  /** Raw network state from NetInfo */
  networkState: NetInfoState | null;
}

interface NetworkProviderProps {
  children: ReactNode;
  onConnectivityChange?: (isConnected: boolean) => void;
}

interface ServerAddress {
  name: string;
  ip: string;
}

// =====================================================
// Context Creation
// =====================================================

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// =====================================================
// Helper: Check if a URL is reachable (lightweight ping)
// =====================================================

const isUrlReachable = async (url: string, timeout = PING_TIMEOUT): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${url}/ping`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

// =====================================================
// Helper: Discover and store server local addresses
// =====================================================

const discoverServerAddresses = async (apiUrl: string): Promise<void> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${apiUrl}/network-config`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return;

    const data = await response.json();
    if (data?.addresses?.length > 0 && data?.port) {
      // Store the server addresses for offline fallback
      await AsyncStorage.setItem(
        STORAGE_KEY_SERVER_ADDRESSES,
        JSON.stringify({ addresses: data.addresses, port: data.port }),
      );

      // Build and store the primary local URL (first non-loopback IPv4)
      const primaryAddr = data.addresses[0];
      if (primaryAddr?.ip) {
        const localUrl = `http://${primaryAddr.ip}:${data.port}`;
        await AsyncStorage.setItem(STORAGE_KEY_LOCAL_API, localUrl);

        if (__DEV__) {
          console.log(
            `[NetworkContext] Discovered server local addresses:`,
            data.addresses.map((a: ServerAddress) => a.ip).join(", "),
            `-> Stored fallback: ${localUrl}`,
          );
        }
      }
    }
  } catch {
    // Silently fail - discovery is best-effort
  }
};

// =====================================================
// Helper: Find a reachable local API URL
// =====================================================

const findReachableLocalUrl = async (): Promise<string | null> => {
  try {
    // 1. Try the configured OFFLINE_API_URL first (if different from online)
    if (OFFLINE_API_URL !== ONLINE_API_URL) {
      if (await isUrlReachable(OFFLINE_API_URL)) {
        return OFFLINE_API_URL;
      }
    }

    // 2. Try the stored local URL from server discovery
    const storedUrl = await AsyncStorage.getItem(STORAGE_KEY_LOCAL_API);
    if (storedUrl) {
      if (await isUrlReachable(storedUrl)) {
        return storedUrl;
      }
    }

    // 3. Try all stored server addresses
    const storedAddresses = await AsyncStorage.getItem(STORAGE_KEY_SERVER_ADDRESSES);
    if (storedAddresses) {
      const { addresses, port } = JSON.parse(storedAddresses) as {
        addresses: ServerAddress[];
        port: number;
      };

      for (const addr of addresses) {
        const url = `http://${addr.ip}:${port}`;
        if (url !== storedUrl) {
          // Don't re-check the one we already tried
          if (await isUrlReachable(url)) {
            // Update the stored URL for next time
            await AsyncStorage.setItem(STORAGE_KEY_LOCAL_API, url);
            return url;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
};

// =====================================================
// Network Provider Component
// =====================================================

/**
 * NetworkProvider - Provides network connectivity monitoring throughout the app
 *
 * Features:
 * - Monitors network connectivity continuously using NetInfo
 * - Automatically discovers local server addresses for LAN fallback
 * - When internet is lost but LAN is available, finds and uses local API server
 * - Updates axiosClient baseURL automatically when connectivity changes
 */
export const NetworkProvider = ({
  children,
  onConnectivityChange,
}: NetworkProviderProps) => {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isNetworkReady, setIsNetworkReady] = useState<boolean>(false);
  const [currentBaseUrl, setCurrentBaseUrl] = useState<string>(ONLINE_API_URL);

  const subscriptionRef = useRef<NetInfoSubscription | null>(null);
  const prevConnectedRef = useRef<boolean | null>(null);
  const isResolvingRef = useRef<boolean>(false);
  const hasDiscoveredRef = useRef<boolean>(false);

  /**
   * Set the active API URL (updates state + axios client)
   */
  const setActiveUrl = useCallback((url: string) => {
    setCurrentBaseUrl(url);
    updateApiUrl(url);
  }, []);

  /**
   * Discover server addresses (run once when online)
   */
  const tryDiscoverServer = useCallback(async () => {
    if (hasDiscoveredRef.current) return;
    hasDiscoveredRef.current = true;

    const currentUrl = getCurrentApiUrl();
    await discoverServerAddresses(currentUrl);
  }, []);

  /**
   * Resolve the best API URL based on network conditions.
   * Called when connectivity changes.
   */
  const resolveApiUrl = useCallback(
    async (state: NetInfoState) => {
      // Prevent concurrent resolution
      if (isResolvingRef.current) return;
      isResolvingRef.current = true;

      try {
        const hasNetwork = state.isConnected === true;
        const hasInternet = state.isInternetReachable === true;

        if (!hasNetwork) {
          // No network at all - truly offline
          if (__DEV__) {
            console.log("[NetworkContext] No network connection - fully offline");
          }
          setIsConnected(false);
          // Keep current URL (might have cached data)
          return;
        }

        if (hasInternet) {
          // Has internet - use the primary online URL
          if (__DEV__) {
            console.log("[NetworkContext] Internet available -> using ONLINE URL:", ONLINE_API_URL);
          }
          setIsConnected(true);
          setActiveUrl(ONLINE_API_URL);

          // Discover server addresses in the background (for future offline use)
          tryDiscoverServer();
          return;
        }

        // Has network (WiFi/LAN) but no internet
        // This is the LAN-without-internet scenario
        if (__DEV__) {
          console.log("[NetworkContext] Network available but no internet - searching for local API...");
        }

        // First, check if the online URL is actually reachable
        // (might be a split-horizon DNS or the check was wrong)
        if (await isUrlReachable(ONLINE_API_URL)) {
          if (__DEV__) {
            console.log("[NetworkContext] Online URL reachable despite no internet flag -> using it");
          }
          setIsConnected(true);
          setActiveUrl(ONLINE_API_URL);
          return;
        }

        // Try to find a reachable local server
        const localUrl = await findReachableLocalUrl();
        if (localUrl) {
          if (__DEV__) {
            console.log("[NetworkContext] Found local API server:", localUrl);
          }
          setIsConnected(true);
          setActiveUrl(localUrl);
          return;
        }

        // No API reachable - mark as disconnected but keep last URL
        if (__DEV__) {
          console.log("[NetworkContext] No API server reachable - offline");
        }
        setIsConnected(false);
      } finally {
        isResolvingRef.current = false;
      }
    },
    [setActiveUrl, tryDiscoverServer],
  );

  /**
   * Handle network state changes
   */
  const handleNetworkStateChange = useCallback(
    (state: NetInfoState) => {
      setNetworkState(state);

      const hasNetwork = state.isConnected === true;
      const hasInternet = state.isInternetReachable === true;
      const wasConnected = prevConnectedRef.current;

      // Quick path: if internet is available, switch immediately
      if (hasInternet) {
        setIsConnected(true);
        if (currentBaseUrl !== ONLINE_API_URL) {
          setActiveUrl(ONLINE_API_URL);
        }
        if (wasConnected !== true) {
          prevConnectedRef.current = true;
          onConnectivityChange?.(true);
        }
        // Discover in background
        tryDiscoverServer();
        setIsNetworkReady(true);
        return;
      }

      // If we have network but not internet, do async resolution
      if (hasNetwork && state.isInternetReachable === false) {
        // Run async URL resolution
        resolveApiUrl(state).then(() => {
          const nowConnected = isConnected;
          if (wasConnected !== nowConnected) {
            prevConnectedRef.current = nowConnected;
            onConnectivityChange?.(nowConnected);
          }
          setIsNetworkReady(true);
        });
        return;
      }

      // No network at all
      if (!hasNetwork) {
        setIsConnected(false);
        if (wasConnected !== false) {
          prevConnectedRef.current = false;
          onConnectivityChange?.(false);
        }
      }

      setIsNetworkReady(true);
    },
    [currentBaseUrl, isConnected, setActiveUrl, resolveApiUrl, tryDiscoverServer, onConnectivityChange],
  );

  /**
   * Manually refresh the network state
   */
  const refreshNetworkState = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      handleNetworkStateChange(state);
    } catch (error) {
      if (__DEV__) {
        console.error("[NetworkContext] Error refreshing network state:", error);
      }
    }
  }, [handleNetworkStateChange]);

  const getApiUrl = useCallback((): string => {
    return currentBaseUrl;
  }, [currentBaseUrl]);

  // Subscribe to network state changes on mount
  useEffect(() => {
    // Load stored local URL for immediate fallback availability
    AsyncStorage.getItem(STORAGE_KEY_LOCAL_API).then((stored) => {
      if (stored && __DEV__) {
        console.log("[NetworkContext] Loaded stored local API URL:", stored);
      }
    });

    // Initial fetch
    NetInfo.fetch().then(handleNetworkStateChange);

    // Subscribe to ongoing changes
    subscriptionRef.current = NetInfo.addEventListener(handleNetworkStateChange);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [handleNetworkStateChange]);

  const contextValue = useMemo<NetworkContextType>(
    () => ({
      isConnected,
      isNetworkReady,
      currentBaseUrl,
      isUsingOfflineUrl: currentBaseUrl !== ONLINE_API_URL,
      getApiUrl,
      refreshNetworkState,
      networkState,
    }),
    [isConnected, isNetworkReady, currentBaseUrl, getApiUrl, refreshNetworkState, networkState],
  );

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

// =====================================================
// Custom Hook
// =====================================================

/**
 * useNetwork - Hook to access network connectivity state
 */
export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);

  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }

  return context;
};

// =====================================================
// Utility Functions (for use outside React components)
// =====================================================

export const getOnlineApiUrl = (): string => ONLINE_API_URL;

export const getOfflineApiUrl = (): string => OFFLINE_API_URL;

/**
 * Check network connectivity imperatively (one-time check)
 */
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    // Use isConnected (has network) rather than isInternetReachable
    // because LAN-only scenarios should still be "connected"
    return state.isConnected === true;
  } catch {
    return false;
  }
};

/**
 * Get the appropriate API URL based on current connectivity
 */
export const getApiUrlForCurrentConnectivity = async (): Promise<string> => {
  const state = await NetInfo.fetch();

  // If internet is reachable, use online URL
  if (state.isInternetReachable === true) {
    return ONLINE_API_URL;
  }

  // If connected to network but no internet, try local
  if (state.isConnected === true) {
    const localUrl = await findReachableLocalUrl();
    if (localUrl) return localUrl;
  }

  // Fallback
  return OFFLINE_API_URL !== ONLINE_API_URL ? OFFLINE_API_URL : ONLINE_API_URL;
};
