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
 *
 * RELEASE SAFETY: in a production/release build we HARD-GUARD against shipping
 * a private-LAN or cleartext-HTTP API URL. Build 5 was rejected (App Store
 * Guideline 2.1a, "server error on login") because the iOS Archive defaulted to
 * development mode and baked in `.env.development`'s `http://192.168.x.x:3030`
 * address, which is unreachable from Apple's review devices.
 */

// Import the base configuration from app.json
const baseConfig = require("./app.json");

const PRODUCTION_API_URL = "https://api.ankaadesign.com.br";

/**
 * A URL that must NEVER be baked into a store/release binary as the PRIMARY API:
 * empty, cleartext HTTP, localhost, or a private-LAN address (10.x, 172.16-31.x,
 * 192.168.x). Such URLs are unreachable from App Review devices and break login.
 *
 * NOTE: this guard applies ONLY to the primary `apiUrl`. The `fallbackApiUrl` is
 * intentionally a LAN/HTTP address (the on-premise server used when the company
 * internet is down) and is therefore NOT guarded.
 */
const isUnsafeForRelease = (url) =>
  !url ||
  /^http:\/\//i.test(url) ||
  /\/\/(localhost|127\.\d|10\.\d|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url);

module.exports = ({ config }) => {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.EXPO_PUBLIC_APP_ENV === "production";

  // Get API URLs from environment variables or use production defaults
  let apiUrl = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;
  // Keep app.json's extra.fallbackApiUrl (the LAN/local API) when no env override
  // is present. The fallback is intentionally the on-premise LAN server.
  const fallbackApiUrl =
    process.env.EXPO_PUBLIC_FALLBACK_API_URL ||
    baseConfig.expo.extra?.fallbackApiUrl ||
    apiUrl;

  // Hard guard: a production/release build can never ship a LAN/HTTP address as
  // the PRIMARY API URL (the build-5 rejection cause). The fallback is left as-is.
  if (isProduction && isUnsafeForRelease(apiUrl)) {
    apiUrl = PRODUCTION_API_URL;
  }

  return {
    ...config,
    ...baseConfig.expo,
    extra: {
      ...baseConfig.expo.extra,
      // Override API URLs with environment variables (release-guarded above)
      apiUrl,
      fallbackApiUrl,
    },
  };
};
