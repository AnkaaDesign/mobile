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
const baseConfig = require('./app.json');

module.exports = ({ config }) => {
  // Get API URLs from environment variables or use defaults
  // For development: local API is primary, production is fallback
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.10.157:3030';
  const fallbackApiUrl = process.env.EXPO_PUBLIC_FALLBACK_API_URL || 'https://api.ankaadesign.com.br';

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
