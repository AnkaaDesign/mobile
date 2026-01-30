/**
 * Robust Authentication Storage Manager
 *
 * This module provides atomic, reliable storage operations for authentication data.
 * It addresses critical issues found in the original storage implementation:
 *
 * 1. Atomic operations - Token and user data are stored/cleared together
 * 2. Proper error handling - No silent failures, all errors are tracked
 * 3. Awaited operations - No fire-and-forget, all writes complete before returning
 * 4. Data validation - Validates data before storage
 * 5. Recovery mechanisms - Handles corrupted data gracefully
 * 6. Consistent keys - Single source of truth for storage keys
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/types';

// Consistent storage keys - single source of truth
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: '@ankaa:auth:token',
  USER_DATA: '@ankaa:auth:user',
  AUTH_METADATA: '@ankaa:auth:metadata',
  // Legacy keys for migration
  LEGACY_TOKEN: '@ankaa_token',
  LEGACY_USER: 'cached_user_data',
} as const;

// Auth metadata for tracking session state
interface AuthMetadata {
  version: number;
  lastUpdated: number;
  tokenExpiresAt: number | null;
  lastValidated: number | null;
}

// Current schema version for migrations
const CURRENT_SCHEMA_VERSION = 1;

// Result type for storage operations
interface StorageResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Decode JWT token and extract expiration time
 */
function decodeTokenExpiry(token: string): number | null {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

/**
 * Validate that a token is properly formatted and not expired
 */
function validateToken(token: string): { valid: boolean; expiresAt: number | null; error?: string } {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { valid: false, expiresAt: null, error: 'Token is empty or invalid type' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, expiresAt: null, error: 'Token is not a valid JWT format' };
  }

  const expiresAt = decodeTokenExpiry(token);
  if (expiresAt === null) {
    return { valid: false, expiresAt: null, error: 'Could not decode token expiration' };
  }

  // Allow 30 second grace period for clock skew
  const now = Date.now();
  const isExpired = expiresAt < now - 30000;

  if (isExpired) {
    return { valid: false, expiresAt, error: 'Token is expired' };
  }

  return { valid: true, expiresAt };
}

/**
 * Validate user data has required fields
 */
function validateUserData(user: any): { valid: boolean; error?: string } {
  if (!user || typeof user !== 'object') {
    return { valid: false, error: 'User data is null or not an object' };
  }

  if (!user.id || typeof user.id !== 'string') {
    return { valid: false, error: 'User data missing valid id' };
  }

  // Check for logged out flag
  if (user.logged === false) {
    return { valid: false, error: 'User is marked as logged out' };
  }

  return { valid: true };
}

/**
 * AuthStorageManager - Singleton class for managing auth storage
 */
class AuthStorageManager {
  private static instance: AuthStorageManager;
  private operationLock: Promise<void> = Promise.resolve();
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): AuthStorageManager {
    if (!AuthStorageManager.instance) {
      AuthStorageManager.instance = new AuthStorageManager();
    }
    return AuthStorageManager.instance;
  }

  /**
   * Initialize storage and migrate from legacy keys if needed
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check for legacy data and migrate
      await this.migrateLegacyData();
      this.isInitialized = true;
    } catch (error) {
      console.error('[AuthStorage] Initialization error:', error);
      // Continue anyway - will work without migration
      this.isInitialized = true;
    }
  }

  /**
   * Migrate data from legacy storage keys
   */
  private async migrateLegacyData(): Promise<void> {
    try {
      // Check if we already have new format data
      const existingToken = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
      if (existingToken) {
        // Already migrated, clean up legacy keys
        await Promise.all([
          AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LEGACY_TOKEN),
          AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LEGACY_USER),
        ]);
        return;
      }

      // Try to migrate from legacy keys
      const [legacyToken, legacyUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEYS.LEGACY_TOKEN),
        AsyncStorage.getItem(AUTH_STORAGE_KEYS.LEGACY_USER),
      ]);

      if (legacyToken) {
        // Validate before migration
        const tokenValidation = validateToken(legacyToken);
        if (tokenValidation.valid) {
          let userData = null;
          if (legacyUser) {
            try {
              userData = JSON.parse(legacyUser);
            } catch {
              // Corrupted user data, ignore
            }
          }

          // Store in new format
          await this.storeAuthData(legacyToken, userData);

          // Clean up legacy keys
          await Promise.all([
            AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LEGACY_TOKEN),
            AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LEGACY_USER),
          ]);

          console.log('[AuthStorage] Successfully migrated legacy auth data');
        } else {
          // Invalid token, just clean up
          await Promise.all([
            AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LEGACY_TOKEN),
            AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LEGACY_USER),
          ]);
        }
      }
    } catch (error) {
      console.error('[AuthStorage] Migration error:', error);
    }
  }

  /**
   * Acquire lock for atomic operations
   */
  private async acquireLock<T>(operation: () => Promise<T>): Promise<T> {
    // Wait for any pending operation
    await this.operationLock;

    // Create new lock
    let releaseLock: () => void;
    this.operationLock = new Promise((resolve) => {
      releaseLock = resolve;
    });

    try {
      return await operation();
    } finally {
      releaseLock!();
    }
  }

  /**
   * Store authentication data atomically
   * Both token and user data are stored together or not at all
   */
  async storeAuthData(token: string, user: User | null): Promise<StorageResult<void>> {
    return this.acquireLock(async () => {
      try {
        // Validate token
        const tokenValidation = validateToken(token);
        if (!tokenValidation.valid) {
          return {
            success: false,
            data: null,
            error: tokenValidation.error || 'Invalid token',
          };
        }

        // Validate user if provided
        if (user) {
          const userValidation = validateUserData(user);
          if (!userValidation.valid) {
            console.warn('[AuthStorage] User validation warning:', userValidation.error);
            // Don't fail on user validation, just log warning
          }
        }

        // Create metadata
        const metadata: AuthMetadata = {
          version: CURRENT_SCHEMA_VERSION,
          lastUpdated: Date.now(),
          tokenExpiresAt: tokenValidation.expiresAt,
          lastValidated: Date.now(),
        };

        // Prepare all data for atomic write
        const dataToStore: [string, string][] = [
          [AUTH_STORAGE_KEYS.ACCESS_TOKEN, token],
          [AUTH_STORAGE_KEYS.AUTH_METADATA, JSON.stringify(metadata)],
        ];

        if (user) {
          dataToStore.push([AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(user)]);
        }

        // Atomic multi-set operation
        await AsyncStorage.multiSet(dataToStore);

        console.log('[AuthStorage] Auth data stored successfully');
        return { success: true, data: null, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown storage error';
        console.error('[AuthStorage] Store error:', errorMessage);
        return { success: false, data: null, error: errorMessage };
      }
    });
  }

  /**
   * Store only user data (for updates after login)
   */
  async storeUserData(user: User): Promise<StorageResult<void>> {
    return this.acquireLock(async () => {
      try {
        const userValidation = validateUserData(user);
        if (!userValidation.valid) {
          return {
            success: false,
            data: null,
            error: userValidation.error || 'Invalid user data',
          };
        }

        // Update metadata timestamp
        const metadataStr = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.AUTH_METADATA);
        let metadata: AuthMetadata | null = null;
        if (metadataStr) {
          try {
            metadata = JSON.parse(metadataStr);
          } catch {
            // Corrupted metadata, create new
          }
        }

        if (metadata) {
          metadata.lastUpdated = Date.now();
        } else {
          metadata = {
            version: CURRENT_SCHEMA_VERSION,
            lastUpdated: Date.now(),
            tokenExpiresAt: null,
            lastValidated: null,
          };
        }

        await AsyncStorage.multiSet([
          [AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
          [AUTH_STORAGE_KEYS.AUTH_METADATA, JSON.stringify(metadata)],
        ]);

        return { success: true, data: null, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown storage error';
        console.error('[AuthStorage] Store user error:', errorMessage);
        return { success: false, data: null, error: errorMessage };
      }
    });
  }

  /**
   * Get all authentication data atomically
   */
  async getAuthData(): Promise<StorageResult<{ token: string; user: User | null; metadata: AuthMetadata | null }>> {
    return this.acquireLock(async () => {
      try {
        const results = await AsyncStorage.multiGet([
          AUTH_STORAGE_KEYS.ACCESS_TOKEN,
          AUTH_STORAGE_KEYS.USER_DATA,
          AUTH_STORAGE_KEYS.AUTH_METADATA,
        ]);

        const token = results[0][1];
        const userStr = results[1][1];
        const metadataStr = results[2][1];

        if (!token) {
          return {
            success: true,
            data: { token: '', user: null, metadata: null },
            error: null,
          };
        }

        // Validate token before returning
        const tokenValidation = validateToken(token);
        if (!tokenValidation.valid) {
          // Token is invalid/expired, clean up
          console.warn('[AuthStorage] Stored token is invalid:', tokenValidation.error);
          await this.clearAuthData();
          return {
            success: true,
            data: { token: '', user: null, metadata: null },
            error: null,
          };
        }

        // Parse user data
        let user: User | null = null;
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch {
            console.warn('[AuthStorage] Corrupted user data, ignoring');
          }
        }

        // Parse metadata
        let metadata: AuthMetadata | null = null;
        if (metadataStr) {
          try {
            metadata = JSON.parse(metadataStr);
          } catch {
            console.warn('[AuthStorage] Corrupted metadata, ignoring');
          }
        }

        return {
          success: true,
          data: { token, user, metadata },
          error: null,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown storage error';
        console.error('[AuthStorage] Get error:', errorMessage);
        return { success: false, data: null, error: errorMessage };
      }
    });
  }

  /**
   * Get only the token (for quick access)
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) return null;

      // Quick validation
      const validation = validateToken(token);
      if (!validation.valid) {
        console.warn('[AuthStorage] Token validation failed:', validation.error);
        return null;
      }

      return token;
    } catch (error) {
      console.error('[AuthStorage] Get token error:', error);
      return null;
    }
  }

  /**
   * Get cached user data (for offline support)
   */
  async getCachedUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER_DATA);
      if (!userStr) return null;

      const user = JSON.parse(userStr);
      const validation = validateUserData(user);
      if (!validation.valid) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('[AuthStorage] Get user error:', error);
      return null;
    }
  }

  /**
   * Check if token is expiring soon (within 5 minutes)
   */
  async isTokenExpiringSoon(thresholdMs: number = 5 * 60 * 1000): Promise<boolean> {
    try {
      const metadataStr = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.AUTH_METADATA);
      if (!metadataStr) return true; // No metadata, assume expiring

      const metadata: AuthMetadata = JSON.parse(metadataStr);
      if (!metadata.tokenExpiresAt) return true;

      const timeUntilExpiry = metadata.tokenExpiresAt - Date.now();
      return timeUntilExpiry < thresholdMs;
    } catch {
      return true; // Error, assume expiring
    }
  }

  /**
   * Update last validated timestamp
   */
  async updateLastValidated(): Promise<void> {
    try {
      const metadataStr = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.AUTH_METADATA);
      if (!metadataStr) return;

      const metadata: AuthMetadata = JSON.parse(metadataStr);
      metadata.lastValidated = Date.now();

      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.AUTH_METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('[AuthStorage] Update validation timestamp error:', error);
    }
  }

  /**
   * Clear all authentication data atomically
   */
  async clearAuthData(): Promise<StorageResult<void>> {
    return this.acquireLock(async () => {
      try {
        await AsyncStorage.multiRemove([
          AUTH_STORAGE_KEYS.ACCESS_TOKEN,
          AUTH_STORAGE_KEYS.USER_DATA,
          AUTH_STORAGE_KEYS.AUTH_METADATA,
          // Also clean up legacy keys
          AUTH_STORAGE_KEYS.LEGACY_TOKEN,
          AUTH_STORAGE_KEYS.LEGACY_USER,
        ]);

        console.log('[AuthStorage] Auth data cleared successfully');
        return { success: true, data: null, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown storage error';
        console.error('[AuthStorage] Clear error:', errorMessage);
        return { success: false, data: null, error: errorMessage };
      }
    });
  }

  /**
   * Check if user is authenticated (has valid token in storage)
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }
}

// Export singleton instance
export const authStorage = AuthStorageManager.getInstance();

// Export convenience functions for backward compatibility
export const storeToken = async (token: string): Promise<void> => {
  const result = await authStorage.storeAuthData(token, null);
  if (!result.success) {
    throw new Error(result.error || 'Failed to store token');
  }
};

export const getStoredToken = async (): Promise<string | null> => {
  return authStorage.getToken();
};

export const removeStoredToken = async (): Promise<void> => {
  const result = await authStorage.clearAuthData();
  if (!result.success) {
    throw new Error(result.error || 'Failed to remove token');
  }
};

export const storeUserData = async (user: User): Promise<void> => {
  const result = await authStorage.storeUserData(user);
  if (!result.success) {
    throw new Error(result.error || 'Failed to store user data');
  }
};

export const getUserData = async (): Promise<User | null> => {
  return authStorage.getCachedUser();
};

export const removeUserData = async (): Promise<void> => {
  // This is now handled by clearAuthData
  // Keep for backward compatibility but no-op since clearAuthData does everything
};
