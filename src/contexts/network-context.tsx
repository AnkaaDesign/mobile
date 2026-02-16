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
import { updateApiUrl, getCurrentApiUrl } from "../api-client";
import { ONLINE_API_URL, OFFLINE_API_URL } from "@/constants/api";

// =====================================================
// Types & Interfaces
// =====================================================

interface NetworkContextType {
  /**
   * Whether the device has internet connectivity
   */
  isConnected: boolean;

  /**
   * Whether the network state has been determined
   * (initial check complete)
   */
  isNetworkReady: boolean;

  /**
   * The current base URL being used for API calls
   * Automatically switches based on connectivity
   */
  currentBaseUrl: string;

  /**
   * Whether currently using the offline/local URL
   */
  isUsingOfflineUrl: boolean;

  /**
   * Get the appropriate API URL based on current connectivity
   * Same as currentBaseUrl but as a function for flexibility
   */
  getApiUrl: () => string;

  /**
   * Manually refresh the network state
   * Useful for retry scenarios
   */
  refreshNetworkState: () => Promise<void>;

  /**
   * Raw network state from NetInfo
   * For advanced use cases
   */
  networkState: NetInfoState | null;
}

interface NetworkProviderProps {
  children: ReactNode;
  /**
   * Optional callback when connectivity changes
   */
  onConnectivityChange?: (isConnected: boolean) => void;
}

// =====================================================
// Context Creation
// =====================================================

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// =====================================================
// Network Provider Component
// =====================================================

/**
 * NetworkProvider - Provides network connectivity monitoring throughout the app
 *
 * Features:
 * - Monitors network connectivity continuously using NetInfo
 * - Automatically switches API URLs based on connectivity:
 *   - Online: Uses primary cloud API URL
 *   - Offline: Uses local network API URL
 * - Exposes connectivity status and current URL through context
 * - Updates axiosClient baseURL automatically when connectivity changes
 *
 * Usage:
 * - Wrap your app with <NetworkProvider>
 * - Use useNetwork() hook in components to access network state
 */
export const NetworkProvider = ({
  children,
  onConnectivityChange,
}: NetworkProviderProps) => {
  // Network state from NetInfo
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  // Derived connectivity state (simplified boolean)
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Whether initial network check is complete
  const [isNetworkReady, setIsNetworkReady] = useState<boolean>(false);

  // Current base URL being used
  const [currentBaseUrl, setCurrentBaseUrl] = useState<string>(ONLINE_API_URL);

  // Subscription reference for cleanup
  const subscriptionRef = useRef<NetInfoSubscription | null>(null);

  // Previous connectivity state for change detection
  const prevConnectedRef = useRef<boolean | null>(null);

  /**
   * Determine if device has internet connectivity
   * Returns true if connected to internet, false otherwise
   */
  const checkIsConnected = useCallback((state: NetInfoState): boolean => {
    // Check multiple indicators for reliable connectivity detection
    // isConnected: device has network connection (WiFi, cellular, etc.)
    // isInternetReachable: device can actually reach the internet

    // If isInternetReachable is null, it hasn't been determined yet
    // In that case, fall back to isConnected
    if (state.isInternetReachable !== null) {
      return state.isInternetReachable === true;
    }

    return state.isConnected === true;
  }, []);

  /**
   * Update the API URL based on connectivity
   */
  const updateUrlBasedOnConnectivity = useCallback((connected: boolean) => {
    const newUrl = connected ? ONLINE_API_URL : OFFLINE_API_URL;

    // Update local state
    setCurrentBaseUrl(newUrl);

    // Update the axios client's base URL
    updateApiUrl(newUrl);

    if (__DEV__) {
      console.log(
        `[NetworkContext] Connectivity changed: ${connected ? "ONLINE" : "OFFLINE"}`,
        `-> Using URL: ${newUrl}`,
      );
    }
  }, []);

  /**
   * Handle network state changes
   */
  const handleNetworkStateChange = useCallback(
    (state: NetInfoState) => {
      setNetworkState(state);

      const connected = checkIsConnected(state);
      setIsConnected(connected);

      // Only trigger URL update and callback if connectivity actually changed
      if (prevConnectedRef.current !== connected) {
        prevConnectedRef.current = connected;
        updateUrlBasedOnConnectivity(connected);
        onConnectivityChange?.(connected);
      }

      // Mark network as ready after first state update
      setIsNetworkReady(true);
    },
    [checkIsConnected, updateUrlBasedOnConnectivity, onConnectivityChange],
  );

  /**
   * Manually refresh network state
   */
  const refreshNetworkState = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      handleNetworkStateChange(state);
    } catch (error) {
      if (__DEV__) {
        console.error(
          "[NetworkContext] Error refreshing network state:",
          error,
        );
      }
    }
  }, [handleNetworkStateChange]);

  /**
   * Get the current API URL
   */
  const getApiUrl = useCallback((): string => {
    return currentBaseUrl;
  }, [currentBaseUrl]);

  // Subscribe to network state changes on mount
  useEffect(() => {
    // Initial fetch of network state
    NetInfo.fetch().then(handleNetworkStateChange);

    // Subscribe to ongoing changes
    subscriptionRef.current = NetInfo.addEventListener(
      handleNetworkStateChange,
    );

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [handleNetworkStateChange]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<NetworkContextType>(
    () => ({
      isConnected,
      isNetworkReady,
      currentBaseUrl,
      isUsingOfflineUrl: currentBaseUrl === OFFLINE_API_URL,
      getApiUrl,
      refreshNetworkState,
      networkState,
    }),
    [
      isConnected,
      isNetworkReady,
      currentBaseUrl,
      getApiUrl,
      refreshNetworkState,
      networkState,
    ],
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
 *
 * @returns NetworkContextType with connectivity status and current API URL
 * @throws Error if used outside of NetworkProvider
 *
 * @example
 * const { isConnected, currentBaseUrl } = useNetwork();
 *
 * // Check connectivity before making a request
 * if (!isConnected) {
 *   console.log('Using offline URL:', currentBaseUrl);
 * }
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

/**
 * Get the online (primary) API URL
 */
export const getOnlineApiUrl = (): string => ONLINE_API_URL;

/**
 * Get the offline (local) API URL
 */
export const getOfflineApiUrl = (): string => OFFLINE_API_URL;

/**
 * Check network connectivity imperatively (one-time check)
 * For use outside of React components
 *
 * @returns Promise<boolean> - true if connected to internet
 */
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();

    if (state.isInternetReachable !== null) {
      return state.isInternetReachable === true;
    }

    return state.isConnected === true;
  } catch {
    return false;
  }
};

/**
 * Get the appropriate API URL based on current connectivity
 * For use outside of React components (one-time check)
 *
 * @returns Promise<string> - the API URL to use
 */
export const getApiUrlForCurrentConnectivity = async (): Promise<string> => {
  const connected = await checkNetworkConnectivity();
  return connected ? ONLINE_API_URL : OFFLINE_API_URL;
};
