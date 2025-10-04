import AsyncStorage from "@react-native-async-storage/async-storage";

// In-memory storage for synchronous localStorage behavior
let memoryStorage: { [key: string]: string } = {};

// Initialize memory storage from AsyncStorage
const initializeMemoryStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    memoryStorage = {};
    items.forEach(([key, value]) => {
      if (value !== null) {
        memoryStorage[key] = value;
      }
    });
  } catch (error) {
    console.error("Failed to initialize memory storage:", error);
  }
};

// Synchronous localStorage polyfill for React Native
const localStoragePolyfill = {
  getItem: (key: string): string | null => {
    return memoryStorage[key] || null;
  },

  setItem: (key: string, value: string): void => {
    memoryStorage[key] = value;
    // Async save to AsyncStorage (fire and forget)
    AsyncStorage.setItem(key, value).catch((error) => {
      console.error("localStorage.setItem async save error:", error);
    });
  },

  removeItem: (key: string): void => {
    delete memoryStorage[key];
    // Async remove from AsyncStorage (fire and forget)
    AsyncStorage.removeItem(key).catch((error) => {
      console.error("localStorage.removeItem async remove error:", error);
    });
  },

  clear: (): void => {
    memoryStorage = {};
    // Async clear AsyncStorage (fire and forget)
    AsyncStorage.clear().catch((error) => {
      console.error("localStorage.clear async clear error:", error);
    });
  },

  key: (index: number): string | null => {
    const keys = Object.keys(memoryStorage);
    return keys[index] || null;
  },

  get length(): number {
    return Object.keys(memoryStorage).length;
  },
};

// Only apply polyfill if localStorage doesn't exist (React Native environment)
if (typeof localStorage === "undefined") {
  try {
    // Use Object.defineProperty for proper property configuration in Hermes
    Object.defineProperty(global, "localStorage", {
      value: localStoragePolyfill,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  } catch (error) {
    console.warn("Failed to polyfill localStorage with defineProperty:", error);
    // Fallback to direct assignment if needed
    try {
      (global as any).localStorage = localStoragePolyfill;
    } catch (fallbackError) {
      console.error("Failed to polyfill localStorage:", fallbackError);
    }
  }
  // Initialize memory storage
  initializeMemoryStorage();
}

export default localStoragePolyfill;
