/**
 * API Configuration Constants
 *
 * Single source of truth for all API URL configuration in the app.
 * The app uses a dual-API system:
 *   - Online API: Cloud/production API (used when internet is available)
 *   - Fallback API: Local network API (used when internet is unreachable)
 *
 * Configuration Priority:
 * 1. Expo config (app.config.js extra.apiUrl / extra.fallbackApiUrl)
 * 2. Environment variables (EXPO_PUBLIC_API_URL / EXPO_PUBLIC_FALLBACK_API_URL)
 * 3. Production defaults
 *
 * Environment variables are set in:
 *   - .env / .env.development / .env.production (local dev)
 *   - eas.json env block (EAS builds)
 */

import Constants from "expo-constants";

/**
 * Default production API URL.
 * Used as the final fallback when no env var or config is set.
 */
const PRODUCTION_API_URL = "https://api.ankaadesign.com.br";

/**
 * Primary API URL (online/cloud)
 *
 * Priority:
 * 1. app.config.js extra.apiUrl (set from EXPO_PUBLIC_API_URL during build)
 * 2. EXPO_PUBLIC_API_URL environment variable
 * 3. Production default
 */
export const ONLINE_API_URL: string =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  PRODUCTION_API_URL;

/**
 * Fallback API URL (offline/local network)
 * Used when the device has no internet but is on a local network
 * where a local API server is running.
 *
 * Priority:
 * 1. app.config.js extra.fallbackApiUrl (set from EXPO_PUBLIC_FALLBACK_API_URL during build)
 * 2. EXPO_PUBLIC_FALLBACK_API_URL environment variable
 * 3. Same as ONLINE_API_URL (no separate fallback configured)
 */
export const OFFLINE_API_URL: string =
  Constants.expoConfig?.extra?.fallbackApiUrl ||
  process.env.EXPO_PUBLIC_FALLBACK_API_URL ||
  ONLINE_API_URL;

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
 * Check if a URL is the offline/fallback URL
 */
export const isOfflineUrl = (url: string): boolean => {
  return url === OFFLINE_API_URL;
};

/**
 * Check if a URL is the online/production URL
 */
export const isOnlineUrl = (url: string): boolean => {
  return url === ONLINE_API_URL;
};
