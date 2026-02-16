/**
 * Centralized Backup Path Presets
 *
 * These are server-side directory paths sent to the API for backup operations.
 * The APP_ROOT can be configured via the EXPO_PUBLIC_APP_ROOT env var
 * to support different server deployments.
 */

const APP_ROOT = process.env.EXPO_PUBLIC_APP_ROOT || '/home/kennedy/ankaa';

/**
 * Backup path presets organized by priority level.
 * Critical paths are always included; higher priority levels include all lower ones.
 */
export const BACKUP_PATH_PRESETS = {
  critical: [
    APP_ROOT,
    `${APP_ROOT}/.env`,
    `${APP_ROOT}/apps/api/.env`,
  ],
  high: [
    `${APP_ROOT}/apps`,
    `${APP_ROOT}/packages`,
    `${APP_ROOT}/scripts`,
    '/etc/nginx',
    '/etc/ssl',
  ],
  medium: [
    `${APP_ROOT}/docs`,
    `${APP_ROOT}/test-examples`,
    '/var/log/nginx',
    '/var/www',
  ],
  low: [
    `${APP_ROOT}/node_modules`,
    `${APP_ROOT}/.git`,
    '/tmp',
  ],
} as const;
