// Unified storage interface for cross-platform token management
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
  clear?(): Promise<void> | void;
}

// Browser localStorage adapter
export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = "") {
    this.prefix = prefix;
  }

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(this.prefix + key);
      }
      return null;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.prefix + key, value);
      }
    } catch {
      // Silently fail
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.prefix + key);
      }
    } catch {
      // Silently fail
    }
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage);
        keys.forEach((key) => {
          if (key.startsWith(this.prefix)) {
            window.localStorage.removeItem(key);
          }
        });
      }
    } catch {
      // Silently fail
    }
  }
}

// Token management class
export class TokenManager {
  private adapter: StorageAdapter;
  private tokenKey: string;

  constructor(adapter: StorageAdapter, tokenKey: string = "token") {
    this.adapter = adapter;
    this.tokenKey = tokenKey;
  }

  async getToken(): Promise<string | null> {
    const result = await this.adapter.getItem(this.tokenKey);
    return result;
  }

  async setToken(token: string): Promise<void> {
    await this.adapter.setItem(this.tokenKey, token);
  }

  async removeToken(): Promise<void> {
    await this.adapter.removeItem(this.tokenKey);
  }

  async clear(): Promise<void> {
    if (this.adapter.clear) {
      await this.adapter.clear();
    }
  }
}

// Platform-specific storage keys
export const STORAGE_KEYS = {
  WEB: "ankaa_token",
  MOBILE: "@ankaa:token",
  DEFAULT: "auth_token",
} as const;

// Additional storage utility functions for React Native AsyncStorage
const ACCESS_TOKEN_KEY = "@ankaa_token";

// Store token - ONLY use AsyncStorage, no localStorage polyfill
export const storeToken = async (token: string): Promise<void> => {
  console.log("[STORAGE] Storing token in AsyncStorage");
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
};

// Retrieve token - ONLY use AsyncStorage, no localStorage polyfill
export const getStoredToken = async (): Promise<string | null> => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  console.log(`[STORAGE] Retrieved token from AsyncStorage: ${token ? "exists" : "null"}`);
  return token;
};

// Remove token - ONLY use AsyncStorage, no localStorage polyfill
export const removeStoredToken = async (): Promise<void> => {
  console.log("[STORAGE] Removing token from AsyncStorage");
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const storeUserData = async (userData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem("cached_user_data", JSON.stringify(userData));
  } catch (error) {
    console.error("Error storing user data:", error);
  }
};

export const getUserData = async (): Promise<any> => {
  try {
    const userData = await AsyncStorage.getItem("cached_user_data");
    const parsed = userData ? JSON.parse(userData) : null;
    return parsed;
  } catch (error) {
    console.error("Error retrieving user data:", error);
    return null;
  }
};

export const removeUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("cached_user_data");
  } catch (error) {
    console.error("Error removing user data:", error);
  }
};
