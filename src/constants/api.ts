/**
 * API Configuration Constants
 *
 * This file defines the API URLs used for online and offline modes.
 * The app will automatically fall back to the offline URL when the
 * online API is unreachable.
 *
 * Configuration Priority:
 * 1. app.json extra.apiUrl / extra.fallbackApiUrl
 * 2. Environment variables (EXPO_PUBLIC_API_URL / EXPO_PUBLIC_FALLBACK_API_URL)
 * 3. These default constants
 */

/**
 * Local network IP address used for offline mode
 * This is the IP of the local server on the same network
 */
export const LOCAL_SERVER_IP = "192.168.10.169";

/**
 * Primary API URL (Local Server)
 * Used as the default API endpoint
 */
export const ONLINE_API_URL = `http://${LOCAL_SERVER_IP}:3030`;

/**
 * Fallback API URL (Local Server)
 * Used when the primary API is unreachable
 */
export const OFFLINE_API_URL = `http://${LOCAL_SERVER_IP}:3030`;

/**
 * API Configuration Object
 * Provides a structured way to access API URLs
 */
export const API_CONFIG = {
  /** Primary API URL for online operations */
  online: ONLINE_API_URL,
  /** Fallback API URL for offline/local network operations */
  offline: OFFLINE_API_URL,
  /** Timeout in milliseconds for URL reachability tests */
  reachabilityTimeout: 5000,
  /** Whether to automatically switch to fallback on network errors */
  autoFallback: true,
} as const;

/**
 * Check if a URL is the local/offline URL
 */
export const isOfflineUrl = (url: string): boolean => {
  return url.includes(LOCAL_SERVER_IP) || url === OFFLINE_API_URL;
};

/**
 * Check if a URL is the online/production URL
 */
export const isOnlineUrl = (url: string): boolean => {
  return url.includes("api.ankaadesign.com.br") || url === ONLINE_API_URL;
};
