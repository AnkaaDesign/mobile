/**
 * Centralized URL Configuration
 *
 * All environment-driven URLs are resolved here so the rest of the app
 * can import them from a single location.
 *
 * API URLs are defined in @/constants/api.ts (single source of truth).
 * This file re-exports the primary API URL and adds web/webhook URLs.
 */

import { ONLINE_API_URL } from "@/constants/api";

/** Primary API base URL (re-exported from @/constants/api) */
export const API_BASE_URL = ONLINE_API_URL;

/** Web frontend base URL */
export const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_URL || 'https://ankaadesign.com.br';

/** Webhook / WebSocket base URL (used for real-time backup progress, etc.) */
export const WEBHOOK_BASE_URL =
  process.env.EXPO_PUBLIC_WEBHOOK_URL || 'https://webhook.ankaadesign.com.br';

/**
 * Extracts the bare domain from a full URL.
 * e.g. "https://ankaadesign.com.br" -> "ankaadesign.com.br"
 */
export function extractDomain(url: string): string {
  try {
    // Remove protocol
    const withoutProtocol = url.replace(/^https?:\/\//, '');
    // Remove trailing path/slash
    return withoutProtocol.split('/')[0];
  } catch {
    return 'ankaadesign.com.br';
  }
}

/** The bare domain derived from WEB_BASE_URL (e.g. "ankaadesign.com.br") */
export const WEB_DOMAIN = extractDomain(WEB_BASE_URL);

/** The www variant of the domain (e.g. "www.ankaadesign.com.br") */
export const WEB_DOMAIN_WWW = `www.${WEB_DOMAIN}`;
