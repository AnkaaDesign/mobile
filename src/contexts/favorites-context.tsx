import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./auth-context";

const STORAGE_KEY_PREFIX = "@ankaa_favorites";
const SHOW_FAVORITES_KEY_PREFIX = "@ankaa_sidebar_show_favorites";

// User-scoped storage keys to prevent favorites from leaking between accounts
const getStorageKey = (userId?: string) =>
  userId ? `${STORAGE_KEY_PREFIX}:${userId}` : STORAGE_KEY_PREFIX;
const getShowFavoritesKey = (userId?: string) =>
  userId ? `${SHOW_FAVORITES_KEY_PREFIX}:${userId}` : SHOW_FAVORITES_KEY_PREFIX;

export interface FavoriteItem {
  id: string;
  path: string;
  title: string;
  icon?: string;
  addedAt: Date;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  showFavorites: boolean;
  addFavorite: (item: Omit<FavoriteItem, "id" | "addedAt">) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (path: string) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, "id" | "addedAt">) => Promise<void>;
  toggleShowFavorites: () => Promise<void>;
  reloadFromStorage: () => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showFavorites, setShowFavorites] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const currentUserIdRef = useRef<string | undefined>(undefined);
  // When this is true, the save-on-change effect skips the next write so
  // values just read from storage aren't immediately written back. This
  // protects against losing real data during async tutorial restore races.
  const skipNextSaveRef = useRef<boolean>(false);

  /**
   * Re-read favorites from AsyncStorage for the current user. Used by the
   * tutorial system after it injects/restores demo favorites.
   */
  const reloadFromStorage = useCallback(async () => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(getStorageKey(userId));
      skipNextSaveRef.current = true;
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(
          parsed.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt),
          }))
        );
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error reloading favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload favorites when user changes (login/logout/switch account)
  useEffect(() => {
    const userId = user?.id;

    // If user changed, reset and reload favorites for the new user
    if (currentUserIdRef.current !== userId) {
      currentUserIdRef.current = userId;
      setIsLoading(true);

      if (!userId) {
        // User logged out - clear favorites from memory
        setFavorites([]);
        setShowFavorites(true);
        setIsLoading(false);
        return;
      }

      const loadFavorites = async () => {
        try {
          const storageKey = getStorageKey(userId);
          const stored = await AsyncStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            setFavorites(
              parsed.map((item: any) => ({
                ...item,
                addedAt: new Date(item.addedAt),
              }))
            );
          } else {
            // Check legacy key (migration from non-scoped to scoped)
            const legacyStored = await AsyncStorage.getItem(STORAGE_KEY_PREFIX);
            if (legacyStored) {
              const parsed = JSON.parse(legacyStored);
              setFavorites(
                parsed.map((item: any) => ({
                  ...item,
                  addedAt: new Date(item.addedAt),
                }))
              );
              // Migrate to user-scoped key
              await AsyncStorage.setItem(storageKey, legacyStored);
            } else {
              setFavorites([]);
            }
          }

          const showKey = getShowFavoritesKey(userId);
          const showFavoritesStored = await AsyncStorage.getItem(showKey);
          if (showFavoritesStored !== null) {
            setShowFavorites(showFavoritesStored === "true");
          } else {
            setShowFavorites(true);
          }
        } catch (error) {
          console.error("Error loading favorites:", error);
          setFavorites([]);
        } finally {
          setIsLoading(false);
        }
      };

      loadFavorites();
    }
  }, [user?.id]);

  // Save favorites to AsyncStorage whenever they change
  useEffect(() => {
    if (!isLoading && currentUserIdRef.current) {
      if (skipNextSaveRef.current) {
        skipNextSaveRef.current = false;
        return;
      }
      const saveFavorites = async () => {
        try {
          const storageKey = getStorageKey(currentUserIdRef.current);
          await AsyncStorage.setItem(storageKey, JSON.stringify(favorites));
        } catch (error) {
          console.error("Error saving favorites:", error);
        }
      };

      saveFavorites();
    }
  }, [favorites, isLoading]);

  // Save showFavorites to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isLoading && currentUserIdRef.current) {
      const saveShowFavorites = async () => {
        try {
          const showKey = getShowFavoritesKey(currentUserIdRef.current);
          await AsyncStorage.setItem(showKey, showFavorites.toString());
        } catch (error) {
          console.error("Error saving show favorites preference:", error);
        }
      };

      saveShowFavorites();
    }
  }, [showFavorites, isLoading]);

  const addFavorite = useCallback(async (item: Omit<FavoriteItem, "id" | "addedAt">) => {
    const newFavorite: FavoriteItem = {
      ...item,
      id: `${item.path}-${Date.now()}`,
      addedAt: new Date(),
    };

    setFavorites((prev) => [...prev, newFavorite]);
  }, []);

  const removeFavorite = useCallback(async (id: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  }, []);

  const isFavorite = useCallback(
    (path: string): boolean => {
      return favorites.some((fav) => fav.path === path);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (item: Omit<FavoriteItem, "id" | "addedAt">) => {
      const existing = favorites.find((fav) => fav.path === item.path);
      if (existing) {
        await removeFavorite(existing.id);
      } else {
        await addFavorite(item);
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  const toggleShowFavorites = useCallback(async () => {
    setShowFavorites((prev) => !prev);
  }, []);

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const value = useMemo(
    () => ({
      favorites,
      showFavorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      toggleFavorite,
      toggleShowFavorites,
      reloadFromStorage,
      isLoading,
    }),
    [favorites, showFavorites, addFavorite, removeFavorite, isFavorite, toggleFavorite, toggleShowFavorites, reloadFromStorage, isLoading]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
