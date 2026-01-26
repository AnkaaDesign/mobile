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
  // Get API URLs from environment variables or use defaults
  // Using production API for all environments
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL || "https://api.ankaadesign.com.br";
  const fallbackApiUrl =
    process.env.EXPO_PUBLIC_FALLBACK_API_URL ||
    "https://api.ankaadesign.com.br";

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
