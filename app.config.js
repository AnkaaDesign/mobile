/**
 * Expo Configuration
 *
 * This file extends app.json and allows dynamic configuration based on
 * environment variables. During development, values from .env files
 * will take precedence.
 *
 * Priority for API URLs:
 * 1. Environment variables (EXPO_PUBLIC_API_URL, EXPO_PUBLIC_FALLBACK_API_URL)
 * 2. Defaults from app.json
 */

// Import the base configuration from app.json
const baseConfig = require("./app.json");

module.exports = ({ config }) => {
  // Get API URLs from environment variables or use production defaults
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL || "https://api.ankaadesign.com.br";
  // Keep app.json's extra.fallbackApiUrl (the LAN/local API, e.g.
  // http://192.168.10.180:3030) when no env override is present. Without this
  // fallback to baseConfig, a build with no EXPO_PUBLIC_FALLBACK_API_URL would
  // silently lose the LAN address (fallback === apiUrl) and offline/local mode
  // would have nothing to fall back to.
  const fallbackApiUrl =
    process.env.EXPO_PUBLIC_FALLBACK_API_URL ||
    baseConfig.expo.extra?.fallbackApiUrl ||
    apiUrl;

  return {
    ...config,
    ...baseConfig.expo,
    extra: {
      ...baseConfig.expo.extra,
      // Override API URLs with environment variables
      apiUrl,
      fallbackApiUrl,
    },
  };
};
